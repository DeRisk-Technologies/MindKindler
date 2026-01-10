"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { installPack } from "@/marketplace/installer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth"; // Auth Context
import { db } from "@/lib/firebase"; // Firebase
import { doc, getDoc } from "firebase/firestore";

// Mock Loader (In real app, fetch from API or dynamic import based on ID)
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
    const { user } = useAuth(); // Fixed: Get user object
    const tenantId = user?.tenantId; // Fixed: Extract tenantId from user
    
    const [installing, setInstalling] = useState(false);
    const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false); 
    const [installedVersion, setInstalledVersion] = useState<string | null>(null);

    const pack = CATALOG[id];

    // Check Installation Status on Load
    useEffect(() => {
        const checkStatus = async () => {
            if (!pack) return; // Wait for pack to be resolved
            // NOTE: Even if tenantId is missing (loading), we might want to wait. 
            // But if user is SuperAdmin viewing global packs, maybe logic differs? 
            // For now, assume Tenant Context is key.
            
            if (!tenantId) {
                // If no tenantId is available yet, we can't check installation. 
                // Wait for auth to resolve.
                return;
            }

            try {
                // Check 'tenants/{id}/settings/installed_packs'
                const ref = doc(db, `tenants/${tenantId}/settings/installed_packs`);
                const snap = await getDoc(ref);
                
                if (snap.exists()) {
                    const data = snap.data();
                    const packData = data[pack.id]; // Access by pack ID (e.g. 'uk_la_pack')
                    
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
            // We pass the tenantId explicitly from context
            const result = await installPack(pack, tenantId || "default");
            
            if (result.success) {
                toast({ 
                    title: isAlreadyInstalled ? "Pack Updated" : "Installation Complete", 
                    description: `${pack.name} (v${pack.version}) capabilities deployed successfully.` 
                });
                
                // If it's the UK pack, specifically mention the new Consultation templates
                if (pack.id === 'uk_la_pack') {
                     toast({ 
                        title: "New Features Active", 
                        description: "Consultation Templates (Complex, Person-Centered) are now available in the clinical workspace.",
                        duration: 5000
                    });
                }
                
                // Refresh state
                setIsAlreadyInstalled(true);
                setInstalledVersion(pack.version);
                
                // Optional: Redirect
                // router.push('/dashboard/marketplace/installed');
            } else {
                 throw new Error(result.errors ? result.errors[0] : "Unknown error");
            }
        } catch (e: any) {
            toast({ 
                title: "Installation Failed", 
                description: e.message,
                variant: "destructive" 
            });
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold">{pack.name}</h1>
                    <div className="flex gap-2 mt-2">
                        {pack.regionTags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                        <Badge variant="secondary">v{pack.version}</Badge>
                        {isAlreadyInstalled && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Installed {installedVersion && `(v${installedVersion})`}
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
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader><CardTitle>Manage Pack</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                <strong>Version:</strong> {pack.version}<br/>
                                <strong>Modules:</strong> {
                                    (pack.capabilities?.complianceWorkflows?.length || 0) + 
                                    (pack.capabilities?.consultationTemplates?.length || 0)
                                }
                            </div>
                            
                            <Button className="w-full" onClick={handleInstall} disabled={installing}>
                                {installing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> 
                                ) : isAlreadyInstalled ? (
                                    <RefreshCw className="mr-2 h-4 w-4"/>
                                ) : (
                                    <Download className="mr-2 h-4 w-4"/>
                                )}
                                
                                {installing 
                                    ? "Deploying..." 
                                    : isAlreadyInstalled 
                                        ? "Update / Reinstall" 
                                        : "Install Pack"
                                }
                            </Button>
                            
                            {isAlreadyInstalled && (
                                <p className="text-xs text-slate-400 text-center">
                                    Reinstalling will update configuration but preserve your data.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
