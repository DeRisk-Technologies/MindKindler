"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, CheckCircle2, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { installPack } from "@/marketplace/installer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Mock Loader
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import usPack from "@/marketplace/catalog/us_district_pack.json";
import ngPack from "@/marketplace/catalog/nigeria_foundation_pack.json";
import dachPack from "@/marketplace/catalog/dach_pack.json";
import gulfPack from "@/marketplace/catalog/gulf_pack.json";

const CATALOG: Record<string, any> = {
    uk_la_pack: ukPack,
    us_district_pack: usPack,
    nigeria_foundation_pack: ngPack,
    dach_pack: dachPack,
    gulf_pack: gulfPack
};

export default function PackDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const tenantId = user?.tenantId;
    
    const [installing, setInstalling] = useState(false);
    const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false); 
    const [installedVersion, setInstalledVersion] = useState<string | null>(null);

    const pack = CATALOG[id];

    // Check Installation Status on Load
    useEffect(() => {
        const checkStatus = async () => {
            if (!pack || !tenantId) return;

            try {
                const ref = doc(db, `tenants/${tenantId}/settings/installed_packs`);
                const snap = await getDoc(ref);
                
                if (snap.exists()) {
                    const data = snap.data();
                    const packData = data[pack.id];
                    
                    if (packData && packData.status === 'active') {
                        setIsAlreadyInstalled(true);
                        setInstalledVersion(packData.version);
                    }
                }
            } catch (error) {
                console.error("Failed to check pack status", error);
            }
        };
        
        checkStatus();
    }, [tenantId, pack]);

    if (!pack) return <div>Pack not found</div>;

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const result = await installPack(pack, tenantId || "default");
            
            if (result.success) {
                toast({ 
                    title: isAlreadyInstalled ? "Pack Updated" : "Installation Complete", 
                    description: `${pack.name} (v${pack.version}) is now active.` 
                });
                setIsAlreadyInstalled(true);
                setInstalledVersion(pack.version);
            } else {
                 throw new Error(result.errors ? result.errors[0] : "Unknown error");
            }
        } catch (e: any) {
            toast({ 
                title: "Operation Failed", 
                description: e.message,
                variant: "destructive" 
            });
        } finally {
            setInstalling(false);
        }
    };

    // Helper Logic
    const isUpdateAvailable = installedVersion && isVersionNewer(pack.version, installedVersion);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold">{pack.name}</h1>
                    <div className="flex gap-2 mt-2">
                        {pack.regionTags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                        <Badge variant="secondary">v{pack.version}</Badge>
                        {isAlreadyInstalled && !isUpdateAvailable && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Installed (v{installedVersion})
                            </Badge>
                        )}
                        {isUpdateAvailable && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                Update Available (v{installedVersion} → v{pack.version})
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{pack.description}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Capabilities & Workflows</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {pack.capabilities?.complianceWorkflows?.map((wf: any, i: number) => (
                                    <li key={i} className="flex gap-4 border-l-2 pl-4 border-slate-200">
                                        <div className="text-sm">
                                            <div className="font-semibold text-slate-800">{wf.name}</div>
                                            <div className="text-xs text-muted-foreground">Trigger: {wf.trigger}</div>
                                        </div>
                                    </li>
                                ))}
                                {pack.capabilities?.consultationTemplates?.map((ct: any, i: number) => (
                                     <li key={`ct-${i}`} className="flex gap-4 border-l-2 pl-4 border-indigo-200">
                                        <div className="text-sm">
                                            <div className="font-semibold text-indigo-700">{ct.title}</div>
                                            <div className="text-xs text-muted-foreground">Consultation Mode Template</div>
                                        </div>
                                    </li>
                                ))}
                                {pack.capabilities?.digitalForms?.map((df: any, i: number) => (
                                     <li key={`df-${i}`} className="flex gap-4 border-l-2 pl-4 border-emerald-200">
                                        <div className="text-sm">
                                            <div className="font-semibold text-emerald-700">{df.title}</div>
                                            <div className="text-xs text-muted-foreground">Digital Assessment Form</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-8">
                        <CardHeader><CardTitle>Manage Pack</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* Update Logic UI */}
                            <Button 
                                className={isUpdateAvailable ? "w-full bg-amber-600 hover:bg-amber-700" : "w-full"}
                                variant={!isAlreadyInstalled || isUpdateAvailable ? "default" : "outline"}
                                disabled={installing || (isAlreadyInstalled && !isUpdateAvailable)}
                                onClick={handleInstall}
                            >
                                {installing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> 
                                ) : isUpdateAvailable ? (
                                    <RefreshCw className="mr-2 h-4 w-4"/>
                                ) : isAlreadyInstalled ? (
                                    <CheckCircle2 className="mr-2 h-4 w-4"/>
                                ) : (
                                    <Download className="mr-2 h-4 w-4"/>
                                )}
                                
                                {installing ? "Processing..." 
                                    : isUpdateAvailable ? `Update to v${pack.version}` 
                                    : isAlreadyInstalled ? "Installed" 
                                    : "Install Pack"}
                            </Button>

                            {/* Changelog Alert */}
                            {isUpdateAvailable && pack.changelog && (
                                <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-xs text-amber-900">
                                    <div className="font-semibold flex items-center gap-1 mb-1">
                                        <Sparkles className="h-3 w-3" /> New in v{pack.version}
                                    </div>
                                    {pack.changelog}
                                </div>
                            )}
                            
                            <div className="text-xs text-slate-400 mt-4">
                                <p>Release Date: {pack.releaseDate || 'N/A'}</p>
                                {isAlreadyInstalled && !isUpdateAvailable && (
                                    <p className="mt-1 text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Up to date
                                    </p>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper: Semantic Versioning Check
function isVersionNewer(latest: string, current: string): boolean {
    if (!current) return true;
    if (latest === current) return false;

    const v1 = latest.split('.').map(Number);
    const v2 = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;
        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }
    return false;
}
