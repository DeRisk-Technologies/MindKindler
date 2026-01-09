// src/app/dashboard/marketplace/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Globe, ShieldCheck, Download, CheckCircle, AlertTriangle, Building2, RefreshCw, ChevronRight } from 'lucide-react';
import { installPack } from '@/marketplace/installer';
import Link from 'next/link';

// Mock Catalog (In prod, fetch from API)
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import { MarketplaceManifest } from '@/marketplace/types';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 

const CATALOG: Record<string, any> = {
    'uk_la_pack': ukPack
};

const catalogDisplay = [
    {
        id: 'uk_la_pack',
        name: 'UK Local Authority Standard',
        description: 'Complete compliance suite for UK Schools (EYFS 2025, KCSIE). Includes First Day Calling workflow, WISC-V Norms, and Single Central Record (SCR).',
        version: '2.3.0', // Updated version to match latest file
        region: 'UK',
        tags: ['Statutory', 'Safety', 'Analytics']
    },
    {
        id: 'us_district_pack',
        name: 'US District Standard (FERPA)',
        description: 'FERPA-compliant safeguarding, IDEA workflows for IEPs, and Woodcock-Johnson IV norms.',
        version: '1.0.0',
        region: 'US',
        tags: ['Statutory', 'Legal']
    }
];

export default function MarketplacePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [installing, setInstalling] = useState<string | null>(null);
    const [installed, setInstalled] = useState<Record<string, boolean>>({});
    const [loadingState, setLoadingState] = useState(true);
    const [targetTenantId, setTargetTenantId] = useState<string | null>(null);

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
                                {pack.tags.map(tag => (
                                    <span key={tag} className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {tag}
                                    </span>
                                ))}
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
