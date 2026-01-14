// functions/src/billing/usage-reporter.ts

import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Reusing same instance pattern or re-init if needed
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any,
});

const db = admin.firestore();

export async function reportMeteredUsage(tenantId: string, quantity: number, eventName = 'ai_credits') {
    try {
        // 1. Get Tenant's Stripe Customer ID
        const tenantSnap = await db.collection('tenants').doc(tenantId).get();
        if (!tenantSnap.exists) {
            console.warn(`[UsageReporter] Tenant ${tenantId} not found.`);
            return;
        }
        
        const customerId = tenantSnap.data()?.stripeCustomerId;
        if (!customerId) {
            console.warn(`[UsageReporter] No Stripe Customer for ${tenantId}. Skipping metered billing.`);
            // Only free plan?
            return;
        }

        // 2. Report Usage to Stripe
        // We use 'meter_events' for modern billing
        await stripe.billing.meterEvents.create({
            event_name: eventName,
            payload: {
                value: quantity.toString(),
                stripe_customer_id: customerId,
            },
            timestamp: Math.floor(Date.now() / 1000)
        });

        console.log(`[UsageReporter] Reported ${quantity} ${eventName} for ${tenantId}.`);

    } catch (e: any) {
        // Fail open - don't block the user if billing sync fails, but log error
        console.error(`[UsageReporter] Failed to report usage for ${tenantId}:`, e.message);
    }
}
