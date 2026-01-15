// src/app/actions/verify-purchase.ts
"use server";

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from "stripe";
import { installMarketplacePack } from "./install-pack";

// Ensure Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { 
    apiVersion: '2023-10-16' as any 
});

export async function verifyPurchaseAction(sessionId: string, tenantId: string, urlPackId?: string, userId?: string) {
    let packId = urlPackId;
    let buyerId = userId || 'unknown';

    // 1. Verify with Stripe (if configured and not a mock session)
    if (process.env.STRIPE_SECRET_KEY && !sessionId.includes('mock') && !sessionId.startsWith('sess_mock')) {
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
    } else {
        console.log(`[Verify] Skipping Stripe check for mock session: ${sessionId}`);
    }

    if (!packId) return { success: false, error: "Pack ID not found" };

    // 2. Provision Purchase Record (Optimistic Fulfillment)
    // We use Admin SDK to bypass security rules
    
    // Determine Region - defaulting to UK for Pilot if not specified
    // Ideally we should lookup tenant region from 'tenants' collection in default DB
    // but for now we try to write to 'mindkindler-uk' or default based on config.
    const region = 'uk'; 
    const shardId = `mindkindler-${region}`;
    
    let db;
    try {
        db = getFirestore(admin.app(), shardId);
    } catch (e) {
        console.warn(`[Verify] Failed to connect to shard ${shardId}, falling back to default.`);
        db = admin.firestore();
    }
    
    try {
        const purchasesRef = db.collection('marketplace_purchases');
        const snap = await purchasesRef
            .where('tenantId', '==', tenantId)
            .where('packId', '==', packId)
            .limit(1)
            .get();

        if (snap.empty) {
            await purchasesRef.add({
                tenantId,
                packId,
                userId: buyerId,
                status: 'active',
                purchaseDate: new Date().toISOString(),
                stripeSessionId: sessionId,
                source: 'success_page_optimistic'
            });
            console.log(`[Verify] Recorded purchase for ${packId}`);
        }
    } catch (e) {
        console.error("[Verify] Database Write Failed:", e);
        return { success: false, error: "Database Write Failed" };
    }

    // 3. Trigger Installation
    return await installMarketplacePack(tenantId, packId, buyerId, region);
}
