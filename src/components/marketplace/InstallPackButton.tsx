// src/components/marketplace/InstallPackButton.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { installMarketplacePack } from "@/app/actions/install-pack";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, Download, ShoppingCart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface InstallPackButtonProps {
    item: any;
    tenantId: string;
    userId: string;
}

export function InstallPackButton({ item, tenantId, userId }: InstallPackButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    // Determine Label
    const isFree = !item.price || item.price === 0;
    const hasTrial = item.trialDays && item.trialDays > 0;
    
    let label = "Install Now";
    let Icon = Download;
    
    if (!isFree) {
        if (hasTrial) {
            label = `Start ${item.trialDays}-Day Free Trial`;
            Icon = Sparkles;
        } else {
            label = `Subscribe for £${item.price}/mo`;
            Icon = ShoppingCart;
        }
    }

    const handleInstall = async () => {
        setLoading(true);
        try {
            // 1. Try to install (Server Action)
            const result = await installMarketplacePack(tenantId, item.id, userId);

            if (result.success) {
                toast({ title: "Success", description: "Pack installed!" });
                router.push('/dashboard/marketplace/installed');
            } else if (result.requiresPayment) {
                // 2. Redirect to Stripe
                toast({ title: "Redirecting...", description: "Secure checkout via Stripe." });
                
                const createCheckout = httpsCallable(functions, 'createStripeCheckoutV2');
                
                // Use success page URL with session_id placeholder
                const baseUrl = window.location.origin;
                const successUrl = `${baseUrl}/dashboard/marketplace/success?session_id={CHECKOUT_SESSION_ID}&packId=${item.id}`;
                const cancelUrl = window.location.href;

                const response: any = await createCheckout({
                    tenantId,
                    priceId: result.priceId || item.stripePriceId,
                    trialDays: item.trialDays,
                    successUrl,
                    cancelUrl,
                    metadata: { packId: item.id, userId }
                });

                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    throw new Error("Failed to initialize checkout.");
                }
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", description: e.message || "Installation failed", variant: "destructive" });
            setLoading(false);
        }
    };

    return (
        <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 font-semibold" onClick={handleInstall} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Icon className="mr-2 h-5 w-5"/>}
            {label}
        </Button>
    );
}
