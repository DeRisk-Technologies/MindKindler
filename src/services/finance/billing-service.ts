import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
    Subscription, 
    Invoice, 
    Transaction, 
    Plan, 
    PaymentMethod,
    InvoiceStatus
} from '@/types/finance';

// Mock Plans Data (In prod, sync from Stripe via Webhook -> Firestore)
const MOCK_PLANS: Plan[] = [
    { 
        id: 'plan_basic', 
        name: 'Essential', 
        tier: 'basic', 
        interval: 'month', 
        currency: 'USD', 
        amount: 2900, 
        features: ['caseload_50', 'basic_reports'] 
    },
    { 
        id: 'plan_pro', 
        name: 'Professional', 
        tier: 'pro', 
        interval: 'month', 
        currency: 'USD', 
        amount: 7900, 
        features: ['unlimited_cases', 'ai_copilot', 'teams_integration'] 
    },
    { 
        id: 'plan_enterprise', 
        name: 'Enterprise', 
        tier: 'enterprise', 
        interval: 'year', 
        currency: 'USD', 
        amount: 99900, 
        features: ['sso', 'data_residency', 'audit_logs', 'dedicated_support'] 
    }
];

/**
 * Service to handle Tenant Billing operations.
 * Enforces tenant isolation via path: tenants/{tenantId}/billing/...
 */
export const billingService = {
    
    getPlans(): Plan[] {
        return MOCK_PLANS;
    },

    /**
     * Get active subscription for a tenant.
     * Checks Firestore first, returns Default Trial mock if empty.
     */
    async getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
        try {
            const q = query(
                collection(db, `tenants/${tenantId}/billing/subscriptions`), 
                where('status', 'in', ['active', 'trialing', 'past_due']),
                orderBy('currentPeriodEnd', 'desc'),
                limit(1)
            );
            const snap = await getDocs(q);
            
            if (snap.empty) {
                // Return default trial state for new tenants
                return {
                    id: 'sub_trial_default',
                    tenantId,
                    planId: 'plan_basic',
                    status: 'trialing',
                    currentPeriodStart: new Date().toISOString(),
                    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
                    cancelAtPeriodEnd: false,
                    metadata: { note: 'Auto-generated trial' }
                };
            }
            return { id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription;
        } catch (error) {
            console.error("Error fetching subscription:", error);
            throw error;
        }
    },

    async updateSubscription(tenantId: string, planId: string): Promise<void> {
        // In production: Call Cloud Function 'createStripeCheckoutSession'
        // For MVP: Log intent
        console.log(`[Billing] Intent to upgrade tenant ${tenantId} to ${planId}`);
        return; 
    },

    async getInvoices(tenantId: string): Promise<Invoice[]> {
        const q = query(
            collection(db, `tenants/${tenantId}/billing/invoices`),
            orderBy('created', 'desc'), // Assuming 'created' field exists on Stripe invoices
            limit(20)
        );
        // Fallback to mock if collection empty for demo
        try {
            const snap = await getDocs(q);
            if (!snap.empty) {
                return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
            }
        } catch(e) {
            console.warn("Invoice fetch failed or empty, returning mocks");
        }

        return [
            {
                id: 'inv_mock_1',
                tenantId,
                number: 'INV-2023-001',
                currency: 'USD',
                status: 'paid',
                subtotal: 2900,
                tax: 0,
                total: 2900,
                amountDue: 0,
                amountPaid: 2900,
                amountRemaining: 0,
                lines: [{ id: 'l1', description: 'Essential Plan - Oct 2023', amount: 2900, currency: 'USD', quantity: 1 }],
                customerName: 'Tenant Admin',
                customerEmail: 'admin@tenant.com',
                dueDate: '2023-10-01',
                paidAt: '2023-10-01',
                metadata: {}
            }
        ];
    },

    async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
        // In production: Call Cloud Function 'getStripePaymentMethods'
        // Security: Never store raw card details in Firestore. 
        // We fetch only metadata (last4, brand) from Stripe or a secured Firestore subcollection.
        
        return [
            {
                id: 'pm_mock_1',
                tenantId,
                type: 'card',
                details: { brand: 'Visa', last4: '4242', expiryMonth: 12, expiryYear: 2025 },
                isDefault: true,
                status: 'valid'
            }
        ];
    }
};
