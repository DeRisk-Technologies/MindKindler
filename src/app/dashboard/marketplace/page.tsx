// src/app/dashboard/marketplace/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Globe, ShieldCheck, Download, CheckCircle, AlertTriangle } from 'lucide-react';
// FIX: Import the client-side installer function directly
import { installPack } from '@/marketplace/installer';
// import { installMarketplacePack } from '@/app/actions/install-pack'; // Removed Server Action import

// Mock Catalog (In prod, fetch from API)
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import { MarketplaceManifest } from '@/marketplace/types';

// In a real app, these would be fetched dynamically. 
// For now, we manually map the ID to the JSON import for the client-side call.
const CATALOG: Record<string, any> = {
    'uk_la_pack': ukPack
};

const catalogDisplay = [
    {
        id: 'uk_la_pack',
        name: 'UK Local Authority Standard',
        description: 'Complete compliance suite for UK Schools (EYFS 2025, KCSIE). Includes First Day Calling workflow, WISC-V Norms, and Single Central Record (SCR).',
        version: '2.1.0',
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

    const handleInstall = async (packId: string) => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to install packs." });
            return;
        }

        // Fallback for Dev: If SuperAdmin has no tenantId, use 'default'
        // CASTING USER TO ANY TO AVOID TS ERROR ON tenantId
        const tenantId = (user as any).tenantId || (user.email?.includes('admin') ? 'default' : null);

        if (!tenantId) {
            toast({ 
                variant: "destructive", 
                title: "Configuration Error", 
                description: "Your user account is not linked to a Tenant ID. Please contact support." 
            });
            return;
        }

        setInstalling(packId);

        try {
            // Get the manifest JSON
            const manifest = CATALOG[packId] as MarketplaceManifest;
            if (!manifest) {
                // Fallback for demo packs that don't have a JSON file yet
                throw new Error("Pack manifest not found in catalog (Demo Only).");
            }

            console.log(`Installing pack ${packId} for tenant ${tenantId}...`);
            
            // Client-Side Install
            // This runs in the browser context, using the active User session.
            const res = await installPack(manifest, tenantId);
            
            if (res.success) {
                toast({
                    title: "Installation Complete",
                    description: "The Country Pack has been successfully configured for your tenant.",
                });
                setInstalled(prev => ({ ...prev, [packId]: true }));
            } else {
                console.error("Install Failed:", res.errors);
                toast({
                    variant: "destructive",
                    title: "Installation Failed",
                    description: res.errors?.join(", ") || "Unknown error.",
                });
            }
        } catch (e: any) {
            console.error("Client Error during Install:", e);
            toast({ variant: "destructive", title: "Error", description: e.message || "System error during installation." });
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                <p className="text-muted-foreground">Install regulatory packs, compliance workflows, and analytic engines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogDisplay.map(pack => (
                    <Card key={pack.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="mb-2">{pack.region}</Badge>
                                {pack.region === 'UK' && <Badge className="bg-indigo-600">Recommended</Badge>}
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
                                    <span key={tag} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> {tag}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-slate-50">
                            {installed[pack.id] ? (
                                <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50" disabled>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Installed
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleInstall(pack.id)} 
                                    disabled={!!installing}
                                >
                                    {installing === pack.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Configuring...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" /> Install Pack
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
