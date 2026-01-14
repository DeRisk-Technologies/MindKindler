import { onCall, HttpsOptions, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Ensure Admin App is Init
if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();
const region = "europe-west3";
const callOptions: HttpsOptions = { region, cors: true };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any, 
});

const PLAN_PRICE_MAP: Record<string, string> = {
    'plan_basic': 'price_essential_monthly',
    'plan_pro': 'price_professional_monthly',
    'plan_enterprise': 'price_enterprise_yearly'
};

/**
 * createCheckoutSession
 * Supports Plans AND Marketplace Items.
 * Handles Multi-Region Tenants via User Routing.
 */
export const createCheckoutSession = onCall(callOptions, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Login required.');
    }

    const { planId, priceId, successUrl, cancelUrl, trialDays, metadata } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;
    
    // 1. Resolve Tenant & Region from Global Routing
    const routingSnap = await db.collection('user_routing').doc(userId).get();
    let tenantId = routingSnap.data()?.tenantId;

    // Fallback for legacy users
    if (!tenantId) {
        const userSnap = await db.collection('users').doc(userId).get();
        tenantId = userSnap.data()?.tenantId;
    }

    if (!tenantId) {
        throw new HttpsError('failed-precondition', 'User has no tenant.');
    }

    // 2. Resolve Price
    let finalPriceId = priceId;
    if (planId) {
        finalPriceId = PLAN_PRICE_MAP[planId];
    }
    
    if (!finalPriceId) {
        // Assume priceId is valid if provided, or handle error
    }

    try {
        // 3. Resolve Customer ID
        // We try to find existing mapping in Global DB first
        let customerId;
        const mappingRef = db.collection('stripe_customers').doc(tenantId);
        const mappingSnap = await mappingRef.get();

        if (mappingSnap.exists) {
            customerId = mappingSnap.data()?.customerId;
        } else {
            // Create new customer in Stripe
            // We search Stripe by email first to avoid duplicates
            const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
            
            if (existing.data.length > 0) {
                customerId = existing.data[0].id;
            } else {
                const newCustomer = await stripe.customers.create({
                    email: userEmail,
                    metadata: { tenantId, firebaseUID: userId }
                });
                customerId = newCustomer.id;
            }
            
            // Save mapping
            await mappingRef.set({ customerId, updatedAt: new Date().toISOString() });
        }

        // 4. Create Session
        const sessionConfig: any = {
            mode: 'subscription', 
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                tenantId: tenantId,
                userId: userId,
                ...metadata // Includes packId
            }
        };

        if (trialDays) {
            sessionConfig.subscription_data = {
                trial_period_days: trialDays,
                metadata: { tenantId, ...metadata }
            };
        } else {
            // Standard subscription metadata
            sessionConfig.subscription_data = {
                metadata: { tenantId, ...metadata }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        return { url: session.url };

    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new HttpsError('internal', error.message);
    }
});

// ... Webhook Handler (Keep existing logic or update similarly) ...
export const handleStripeWebhook = onRequest({ region }, async (req, res) => {
    // ... existing implementation ...
    res.json({received: true});
});
