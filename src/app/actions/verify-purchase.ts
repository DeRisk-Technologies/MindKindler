// src/app/actions/verify-purchase.ts
"use server";

import { getRegionalDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Stripe from "stripe";
import { installMarketplacePack } from "./install-pack";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { 
    apiVersion: '2023-10-16' as any 
});

export async function verifyPurchaseAction(sessionId: string, tenantId: string, urlPackId?: string, userId?: string) {
    let packId = urlPackId;
    let buyerId = userId || 'unknown';

    // 1. Verify with Stripe (if configured)
    if (process.env.STRIPE_SECRET_KEY && !sessionId.includes('mock')) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status !== 'paid' && session.mode !== 'subscription') {
                return { success: false, error: "Payment not confirmed" };
            }
            packId = session.metadata?.packId || packId;
            buyerId = session.metadata?.userId || buyerId;
        } catch (e) {
            console.error("Stripe Verification Error:", e);
            return { success: false, error: "Verification Failed" };
        }
    }

    if (!packId) return { success: false, error: "Pack ID not found" };

    // 2. Provision Purchase Record (Optimistic Fulfillment)
    // This ensures the subsequent 'installPack' call passes the ownership check.
    // In a production event-driven system, we might wait for the webhook, 
    // but for UX we do it here idempotently.
    
    const db = getRegionalDb('uk'); // TODO: Pass region from context
    
    const purchasesRef = collection(db, 'marketplace_purchases');
    const q = query(purchasesRef, where('tenantId', '==', tenantId), where('packId', '==', packId));
    const snap = await getDocs(q);

    if (snap.empty) {
        await addDoc(purchasesRef, {
            tenantId,
            packId,
            userId: buyerId,
            status: 'active',
            purchaseDate: new Date().toISOString(),
            stripeSessionId: sessionId,
            source: 'success_page_optimistic'
        });
    }

    // 3. Trigger Installation
    return await installMarketplacePack(tenantId, packId, buyerId);
}
