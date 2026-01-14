// src/app/dashboard/marketplace/[itemId]/page.tsx

"use client";

import React, { use, useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShieldCheck, Download, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { installMarketplacePack } from "@/app/actions/install-pack"; // Use server action
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Mock Catalog Lookup (In real app, fetch from Firestore 'marketplace_items')
import ukPack from "@/marketplace/catalog/uk_la_pack.json";

export default function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
    const { itemId } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [item, setItem] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    // Initial Load
    useEffect(() => {
        // Simulate fetch
        if (itemId === 'uk_la_pack') {
            setItem(ukPack);
        } else {
            // Mock other packs
            setItem({
                id: itemId,
                name: 'Premium Autism Suite',
                description: 'Complete ADOS-2 workflow and report templates.',
                version: '2.0',
                price: 49.00,
                trialDays: 7,
                stripePriceId: 'price_mock_autism'
            });
        }
    }, [itemId]);

    if (!item) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleAction = async () => {
        if (!user?.tenantId) return;
        setProcessing(true);

        try {
            // 1. Attempt Install via Server Action
            const result = await installMarketplacePack(user.tenantId, item.id, user.uid);

            if (result.success) {
                toast({ title: "Success", description: "Pack installed successfully." });
                router.push('/dashboard/marketplace/installed');
            } else if (result.requiresPayment) {
                // 2. Handle Payment Redirect
                toast({ title: "Payment Required", description: "Redirecting to checkout..." });
                
                const createCheckout = httpsCallable(functions, 'createStripeCheckoutV2');
                const checkoutSession: any = await createCheckout({
                    tenantId: user.tenantId,
                    priceId: result.priceId || item.stripePriceId,
                    trialDays: item.trialDays,
                    successUrl: window.location.href + '?success=true',
                    cancelUrl: window.location.href
                });

                if (checkoutSession.data?.url) {
                    window.location.href = checkoutSession.data.url;
                } else {
                    throw new Error("Failed to start checkout");
                }
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    // Determine Button Label
    const isFree = !item.price || item.price === 0;
    const hasTrial = item.trialDays && item.trialDays > 0;
    
    let buttonLabel = "Install Now";
    let Icon = Download;
    
    if (!isFree) {
        if (hasTrial) {
            buttonLabel = `Start ${item.trialDays}-Day Free Trial`;
            Icon = Sparkles;
        } else {
            buttonLabel = `Subscribe for £${item.price}/mo`;
            Icon = ShoppingCart;
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {item.name} <ShieldCheck className="h-6 w-6 text-green-600"/>
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

                            <Button className="w-full size-lg bg-indigo-600 hover:bg-indigo-700" onClick={handleAction} disabled={processing}>
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Icon className="mr-2 h-4 w-4"/>}
                                {buttonLabel}
                            </Button>
                            
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
