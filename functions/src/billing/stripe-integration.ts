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

const MOCK_PRICE_MAP: Record<string, string> = {
    'price_mock_sensory': 'price_1SplQwEyUMirDdEkPK2neuJ0',
};

/**
 * createCheckoutSession
 * Supports Plans AND Marketplace Items.
 * Handles Multi-Region Tenants via User Routing.
 */
export const createCheckoutSession = onCall({ 
    ...callOptions, 
    secrets: ["STRIPE_SECRET_KEY"] 
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Login required.');
    }

    const { planId, priceId, successUrl, cancelUrl, trialDays, metadata } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;
    
    // 1. Resolve Tenant ID
    // Priority: Auth Token Claims > Client Payload > DB Lookup
    let tenantId = request.auth.token.tenantId || request.data.tenantId;

    if (!tenantId) {
        // DB Lookup Fallback
        const routingSnap = await db.collection('user_routing').doc(userId).get();
        tenantId = routingSnap.data()?.tenantId;
    }

    // Legacy Fallback
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
    
    // Check Mock Map
    if (finalPriceId && MOCK_PRICE_MAP[finalPriceId]) {
        console.log(`[Billing] Swapping mock price ${finalPriceId} for real price ${MOCK_PRICE_MAP[finalPriceId]}`);
        finalPriceId = MOCK_PRICE_MAP[finalPriceId];
    }
    
    if (!finalPriceId) {
        // Assume priceId is valid
        // Verify it exists in Stripe if strictly necessary, or trust client (less secure)
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

/**
 * handleStripeWebhook
 * Securely processes Stripe events.
 * Key Logic:
 * - Verify signature
 * - checkout.session.completed -> Enable feature/pack/subscription
 * - invoice.payment_failed -> Update status to 'past_due'
 * - customer.subscription.deleted -> Update status to 'canceled'
 */
export const handleStripeWebhook = onRequest({ 
    region, 
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] 
}, async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is missing');
        res.status(500).send('Configuration Error');
        return;
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            default:
                // console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
        return;
    }

    res.json({ received: true });
});

// --- Webhook Handlers ---

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { tenantId, packId } = session.metadata || {};
    
    if (!tenantId) {
        console.warn('⚠️ Checkout session missing tenantId metadata', session.id);
        return;
    }

    console.log(`✅ Checkout completed for Tenant: ${tenantId}, Pack: ${packId || 'Subscription'}`);

    // Use set with merge: true to avoid "No document to update" errors if the tenant doc 
    // hasn't been fully provisioned in the default DB yet.
    
    if (packId) {
        // It's a Marketplace Pack installation
        const installedRef = db.collection('tenants').doc(tenantId).collection('installed_packs').doc(packId);
        await installedRef.set({
            packId,
            installedAt: new Date().toISOString(),
            status: 'active',
            purchaseId: session.id,
            subscriptionId: session.subscription
        }, { merge: true });
        
        // Update main tenant doc (safe write)
        await db.collection('tenants').doc(tenantId).set({
            modules: {
                [packId]: true
            }
        }, { merge: true });

    } else {
        // It's a Core Platform Subscription
        await db.collection('tenants').doc(tenantId).set({
            subscription: {
                status: 'active',
                planId: session.metadata?.planId || 'pro', // Default or from metadata
                stripeSubscriptionId: session.subscription,
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Cast to any to access subscription strictly to avoid TS errors on some SDK versions
    const subscriptionId = (invoice as any).subscription;
    
    if (!subscriptionId) return;

    // Retrieve subscription using generic SDK call if needed, or assume ID is valid string
    // Here we need to fetch from Stripe because invoice object might not contain metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const tenantId = subscription.metadata?.tenantId;

    if (tenantId) {
        await db.collection('tenants').doc(tenantId).set({
            subscription: {
                status: 'active',
                lastPayment: new Date().toISOString()
            }
        }, { merge: true });
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Cast to any to access subscription strictly
    const subscriptionId = (invoice as any).subscription;
    
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const tenantId = subscription.metadata?.tenantId;

    if (tenantId) {
        await db.collection('tenants').doc(tenantId).set({
            subscription: {
                status: 'past_due',
                paymentFailure: new Date().toISOString()
            }
        }, { merge: true });
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    if (tenantId) {
        await db.collection('tenants').doc(tenantId).set({
            subscription: {
                status: 'canceled',
                canceledAt: new Date().toISOString()
            }
        }, { merge: true });
    }
}
