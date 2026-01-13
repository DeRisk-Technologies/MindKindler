// functions/src/billing/usage.ts

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

// Usage Limits Configuration
const PLAN_LIMITS: Record<string, Record<string, number>> = {
    'free': {
        'report_generation': 5,
        'ai_chat': 50,
        'storage_gb': 1
    },
    'pro': {
        'report_generation': 50,
        'ai_chat': 500,
        'storage_gb': 10
    },
    'enterprise': {
        'report_generation': 999999, // Effectively unlimited
        'ai_chat': 999999,
        'storage_gb': 1000
    }
};

interface UsageRecord {
    count: number;
    resetAt: admin.firestore.Timestamp;
}

/**
 * Checks usage limits and increments counter atomically.
 * Throws HttpsError if limit exceeded.
 */
export async function checkAndIncrementUsage(tenantId: string, feature: 'report_generation' | 'ai_chat') {
    const db = admin.firestore();
    const tenantRef = db.collection('tenants').doc(tenantId);
    const usageRef = tenantRef.collection('usage').doc(feature);

    await db.runTransaction(async (t) => {
        // 1. Fetch Tenant Plan
        const tenantSnap = await t.get(tenantRef);
        if (!tenantSnap.exists) {
            // Default to 'free' if no tenant record found (safe fallback)
            console.warn(`Tenant ${tenantId} not found, defaulting to FREE plan.`);
        }
        
        const plan = tenantSnap.data()?.plan || 'free';
        const limit = PLAN_LIMITS[plan]?.[feature] || 0;

        // 2. Fetch Current Usage
        const usageSnap = await t.get(usageRef);
        let currentCount = 0;
        const now = admin.firestore.Timestamp.now();
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0,0,0,0);

        if (usageSnap.exists) {
            const data = usageSnap.data() as UsageRecord;
            const resetDate = data.resetAt.toDate();
            
            // Check if we need to reset (new month)
            if (resetDate < currentMonthStart) {
                currentCount = 0; // Reset
            } else {
                currentCount = data.count;
            }
        }

        // 3. Enforce Limit
        if (currentCount >= limit) {
            throw new HttpsError('resource-exhausted', 
                `Monthly limit reached for ${feature}. You have used ${currentCount}/${limit}. Please upgrade your plan.`
            );
        }

        // 4. Increment
        const nextReset = new Date(currentMonthStart);
        nextReset.setMonth(nextReset.getMonth() + 1); // Reset next month

        t.set(usageRef, {
            count: currentCount + 1,
            lastUsedAt: now,
            resetAt: admin.firestore.Timestamp.fromDate(nextReset)
        }, { merge: true });
    });
}
