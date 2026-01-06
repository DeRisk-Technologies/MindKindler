// src/types/finance.ts

export type Currency = 'USD' | 'GBP' | 'EUR' | 'NGN' | 'INR';

export type PaymentMethodType = 'card' | 'bank_transfer' | 'direct_debit' | 'wallet';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

// --- 1. Subscription & Plans ---

export interface Plan {
    id: string;
    name: string; // "Basic", "Pro", "Enterprise"
    tier: 'basic' | 'pro' | 'enterprise';
    interval: 'month' | 'year';
    currency: Currency;
    amount: number; // in cents
    features: string[]; // Feature flags enabled by this plan
}

export interface Subscription {
    id: string;
    tenantId: string;
    planId: string;
    status: SubscriptionStatus;
    
    currentPeriodStart: string; // ISO Date
    currentPeriodEnd: string;
    
    cancelAtPeriodEnd: boolean;
    canceledAt?: string;
    
    paymentMethodId?: string; // Default payment method
    
    trialStart?: string;
    trialEnd?: string;
    
    metadata: Record<string, any>;
}

// --- 2. Billing & Invoicing ---

export interface InvoiceLineItem {
    id: string;
    description: string;
    amount: number;
    currency: Currency;
    quantity: number;
    periodStart?: string;
    periodEnd?: string;
}

export interface Invoice {
    id: string; // INV-2023-001
    tenantId: string;
    subscriptionId?: string;
    
    number: string;
    currency: Currency;
    status: InvoiceStatus;
    
    subtotal: number;
    tax: number;
    total: number;
    amountDue: number;
    amountPaid: number;
    amountRemaining: number;
    
    lines: InvoiceLineItem[];
    
    customerName: string;
    customerEmail: string;
    billingAddress?: string;
    
    dueDate: string;
    paidAt?: string;
    invoicePdfUrl?: string; // Generated PDF link
    
    metadata: Record<string, any>;
}

// --- 3. Treasury & Ledger (Double Entry) ---

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface FinanceAccount {
    id: string;
    tenantId: string; // 'platform' for system accounts, or specific tenant ID
    name: string; // "Accounts Receivable", "Stripe Clearing", "Sales Revenue"
    type: AccountType;
    currency: Currency;
    balance: number; // Cached balance
}

export interface LedgerEntry {
    id: string;
    transactionId: string;
    accountId: string;
    direction: 'debit' | 'credit';
    amount: number;
    currency: Currency;
    description: string;
    postedAt: string;
}

export interface Transaction {
    id: string;
    tenantId: string;
    
    amount: number;
    currency: Currency;
    
    gateway: 'stripe' | 'adyen' | 'bank_transfer' | 'system';
    gatewayTransactionId?: string;
    
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    
    description: string;
    invoiceId?: string;
    
    occurredAt: string;
    reconciled: boolean;
    
    metadata: Record<string, any>;
}

// --- 4. Payment Methods ---

export interface PaymentMethod {
    id: string;
    tenantId: string;
    type: PaymentMethodType;
    
    details: {
        last4?: string;
        brand?: string; // Visa, MC
        bankName?: string;
        expiryMonth?: number;
        expiryYear?: number;
    };
    
    isDefault: boolean;
    status: 'valid' | 'expired' | 'requires_verification';
}
