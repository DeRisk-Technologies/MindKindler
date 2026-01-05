import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const db = admin.firestore();

// Initialize Stripe
// Cast to any to bypass strict version string check if SDK definitions are newer/older than dashboard
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any, 
});

// Map Plan IDs from Frontend/Firestore to Stripe Price IDs
const PLAN_PRICE_MAP: Record<string, string> = {
    'plan_basic': 'price_essential_monthly',
    'plan_pro': 'price_professional_monthly',
    'plan_enterprise': 'price_enterprise_yearly'
};

/**
 * createCheckoutSession
 * 
 * Creates a Stripe Checkout Session for a subscription.
 * Called by the frontend "Upgrade" button.
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required.');
    }

    const { planId, successUrl, cancelUrl } = data;
    const userId = context.auth.uid;
    
    // Get Tenant ID (assuming user has custom claim or profile)
    const userSnap = await db.collection('users').doc(userId).get();
    const tenantId = userSnap.data()?.tenantId;

    if (!tenantId) {
        throw new functions.https.HttpsError('failed-precondition', 'User has no tenant.');
    }

    const priceId = PLAN_PRICE_MAP[planId];
    if (!priceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid Plan ID');
    }

    try {
        // 2. Find or Create Stripe Customer
        let customerId;
        const tenantRef = db.collection('tenants').doc(tenantId); 
        const tenantSnap = await tenantRef.get(); 
        let orgSnap = await db.collection('organizations').doc(tenantId).get();
        
        const orgData = orgSnap.exists ? orgSnap.data() : (tenantSnap.exists ? tenantSnap.data() : null);

        if (!orgData) {
             throw new functions.https.HttpsError('not-found', 'Organization not found.');
        }

        if (orgData?.stripeCustomerId) {
            customerId = orgData.stripeCustomerId;
        } else {
            const customer = await stripe.customers.create({
                email: orgData?.primaryContact?.email || userSnap.data()?.email,
                name: orgData?.name || 'MindKindler Customer',
                metadata: {
                    tenantId: tenantId,
                    firebaseUID: userId
                }
            });
            customerId = customer.id;
            await (orgSnap.exists ? orgSnap.ref : tenantRef).update({ stripeCustomerId: customerId });
        }

        // 3. Create Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || 'https://mindkindler.com/dashboard/settings/billing?success=true',
            cancel_url: cancelUrl || 'https://mindkindler.com/dashboard/settings/billing?canceled=true',
            subscription_data: {
                metadata: {
                    tenantId: tenantId,
                    planId: planId
                }
            }
        });

        return { url: session.url };

    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * handleStripeWebhook
 * 
 * HTTP Trigger for Stripe Webhooks.
 * Updates Firestore when subscription status changes.
 */
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session);
            break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdate(subscription);
            break;
        }
        case 'invoice.payment_succeeded': {
             const invoice = event.data.object as Stripe.Invoice;
             await handleInvoicePayment(invoice);
             break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// --- Webhook Handlers ---

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId; 
    if (!tenantId) return;
    console.log(`Checkout completed for tenant ${tenantId}`);
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId;
    if (!tenantId) return;

    const status = sub.status;
    const planId = sub.items.data[0]?.price?.id; 

    const orgRef = db.collection('organizations').doc(tenantId);
    const tenantRef = db.collection('tenants').doc(tenantId);

    // Explicit casting to any to avoid TS errors if types are mismatched in this env
    const s = sub as any;

    const updateData = {
        subscriptionStatus: status,
        subscriptionId: sub.id,
        currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const orgDoc = await orgRef.get();
    if (orgDoc.exists) {
        await orgRef.update(updateData);
    } else {
        await tenantRef.update(updateData).catch(e => console.log("Tenant doc not found either"));
    }

    await db.collection(`tenants/${tenantId}/billing/subscriptions`).doc('active_sub').set({
        id: sub.id,
        status: status,
        currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString(),
        currentPeriodStart: new Date(s.current_period_start * 1000).toISOString(),
        stripePriceId: planId,
        metadata: sub.metadata
    }, { merge: true });
}

async function handleInvoicePayment(invoice: Stripe.Invoice) {
    // Placeholder
}
