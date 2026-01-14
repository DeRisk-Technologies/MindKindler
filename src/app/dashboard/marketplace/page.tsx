// src/app/dashboard/marketplace/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Globe, ShieldCheck, Download, CheckCircle, AlertTriangle, Building2, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { installPack } from '@/marketplace/installer';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Logic Hooks
import { useMarketplaceUpdates } from '@/hooks/use-marketplace-updates';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import { MarketplaceManifest } from '@/marketplace/types';

// Catalog Imports
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import usPack from "@/marketplace/catalog/us_district_pack.json";
import gulfPack from "@/marketplace/catalog/gulf_pack.json";

const CATALOG: Record<string, any> = {
    'uk_la_pack': ukPack,
    'us_district_pack': usPack,
    'gulf_pack': gulfPack
};

// Transform Catalog to Display Array
const catalogDisplay = Object.values(CATALOG).map((pack: any) => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    version: pack.version,
    region: pack.regionTags[0] || 'Global',
    tags: pack.capabilities?.digitalForms ? ['Statutory', 'Forms', 'Compliance'] : ['Statutory', 'Compliance']
}));

export default function MarketplacePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [installing, setInstalling] = useState<string | null>(null);
    const [installed, setInstalled] = useState<Record<string, boolean>>({});
    const [loadingState, setLoadingState] = useState(true);
    const [targetTenantId, setTargetTenantId] = useState<string | null>(null);

    // Lifecycle Hook
    const { updatesAvailable, newModulesAvailable, loading: updatesLoading } = useMarketplaceUpdates();

    // Fetch Installed Status on Mount
    useEffect(() => {
        if (!user) return;

        const tid = user.tenantId; 
        setTargetTenantId(tid || null);
        
        if (!tid) {
            setLoadingState(false);
            return;
        }

        async function checkInstalledPacks() {
            try {
                const docRef = doc(db, `tenants/${tid}/settings/installed_packs`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const statusMap: Record<string, boolean> = {};
                    Object.keys(data).forEach(key => {
                        statusMap[key] = true;
                    });
                    setInstalled(statusMap);
                }
            } catch (e) {
                console.error("Failed to fetch installed packs", e);
            } finally {
                setLoadingState(false);
            }
        }

        checkInstalledPacks();
    }, [user]);

    const handleInstall = async (packId: string) => {
        if (!user || !targetTenantId) return;

        setInstalling(packId);
        try {
            const manifest = CATALOG[packId] as MarketplaceManifest;
            if (!manifest) throw new Error("Pack manifest not found.");

            const res = await installPack(manifest, targetTenantId);
            
            if (res.success) {
                toast({
                    title: installed[packId] ? "Pack Updated" : "Installation Complete",
                    description: `Successfully configured ${packId} for ${targetTenantId}`,
                });
                setInstalled(prev => ({ ...prev, [packId]: true }));
            } else {
                toast({ variant: "destructive", title: "Failed", description: res.errors?.join(", ") });
            }
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                    <p className="text-muted-foreground">Regulatory packs, compliance workflows, and analytic engines.</p>
                </div>
                {targetTenantId && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-700 shadow-sm">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Active Tenant: {targetTenantId}</span>
                    </div>
                )}
            </div>

            {/* Lifecycle Alerts */}
            {updatesAvailable.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Updates Available</AlertTitle>
                    <AlertDescription className="mt-1">
                        New compliance standards released for: 
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                            {updatesAvailable.map(u => (
                                <li key={u.manifest.id}>
                                    <strong>{u.manifest.name}</strong> (v{u.installedVersion} → v{u.latestVersion})
                                    {u.changelog && <span className="block text-slate-500 italic">Change: {u.changelog}</span>}
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {newModulesAvailable.length > 0 && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>New Regional Modules</AlertTitle>
                    <AlertDescription>
                        We detected you are in the <strong>{user?.region?.toUpperCase()}</strong> region. You might be interested in:
                        <div className="flex gap-2 mt-2">
                            {newModulesAvailable.map(m => (
                                <Badge key={m.manifest.id} variant="secondary" className="cursor-pointer hover:bg-blue-200" onClick={() => handleInstall(m.manifest.id)}>
                                    Install {m.manifest.name}
                                </Badge>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogDisplay.map(pack => (
                    <Card key={pack.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="mb-2">{pack.region}</Badge>
                                {installed[pack.id] && (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Installed</Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Globe className="h-5 w-5 text-slate-500" />
                                {pack.name}
                            </CardTitle>
                            <CardDescription className="pt-2 min-h-[60px]">
                                {pack.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex flex-wrap gap-2 mt-2">
                                {pack.tags.map((tag: string) => (
                                    <span key={tag} className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 text-xs text-slate-400">
                                Version: {pack.version}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-slate-50 gap-2">
                            <Button 
                                variant={installed[pack.id] ? "outline" : "default"}
                                className="flex-grow h-10" 
                                onClick={() => handleInstall(pack.id)} 
                                disabled={!!installing || loadingState}
                            >
                                {installing === pack.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : installed[pack.id] ? (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {installing === pack.id ? "Working..." : installed[pack.id] ? "Update" : "Install"}
                            </Button>
                            
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/marketplace/${pack.id}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
