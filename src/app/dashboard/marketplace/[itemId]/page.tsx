// src/app/dashboard/marketplace/[itemId]/page.tsx

"use client";

import React, { use, useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { InstallPackButton } from "@/components/marketplace/InstallPackButton";
import { doc, getDoc } from 'firebase/firestore'; 
import { getRegionalDb } from '@/lib/firebase'; 

// Mock Catalog Lookup (Static Fallback)
import ukPack from "@/marketplace/catalog/uk_la_pack.json";

export default function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
    const { itemId } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    
    const [item, setItem] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;

        async function load() {
            // 1. Try Dynamic Fetch (Regional)
            try {
                const db = getRegionalDb(user.region);
                const snap = await getDoc(doc(db, 'marketplace_items', itemId));
                if (snap.exists()) {
                    const data = snap.data();
                    setItem({ ...data, region: user.region }); // Inject region for button
                    return;
                }
            } catch (e) {
                console.error("Dynamic fetch failed", e);
            }

            // 2. Fallback Static
            if (itemId === 'uk_la_pack') {
                setItem({ ...ukPack, region: 'uk' });
            } else {
                // Mock legacy fallback
                setItem({
                    id: itemId,
                    name: 'Unknown Pack',
                    description: 'Pack details not found.',
                    version: '0.0',
                    price: 0,
                    trialDays: 0,
                    region: user.region || 'uk'
                });
            }
        }
        load();
    }, [itemId, user]);

    if (!item) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const isFree = !item.price || item.price === 0;
    const hasTrial = item.trialDays && item.trialDays > 0;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {item.name || item.title} <ShieldCheck className="h-6 w-6 text-green-600"/>
                    </h1>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">v{item.version}</Badge>
                        <Badge variant="secondary">Official Pack</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{item.description}</p>
                            {item.changelog && (
                                <div className="bg-slate-50 p-4 rounded text-sm">
                                    <strong>What's New:</strong> {item.changelog}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-8 border-indigo-100 shadow-md">
                        <CardHeader className="bg-slate-50/50 pb-2">
                            <CardTitle className="text-lg">Get Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">
                                    {isFree ? "Free" : `£${item.price}`}
                                    {!isFree && <span className="text-sm font-normal text-slate-500"> / mo</span>}
                                </div>
                                {hasTrial && <p className="text-xs text-green-600 font-medium mt-1">Includes {item.trialDays}-day free trial</p>}
                            </div>

                            {/* Client Component handling Stripe Logic */}
                            {user && (
                                <InstallPackButton 
                                    item={item} 
                                    tenantId={user.tenantId} 
                                    userId={user.uid} 
                                    region={user.region} // Pass region
                                />
                            )}
                            
                            <p className="text-xs text-center text-muted-foreground">
                                {isFree ? "Instant installation." : "Secure payment via Stripe."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
