// functions/src/admin/healthCheck.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * System Health Diagnostic
 * Performs live checks on critical infrastructure.
 */
export const checkSystemHealthHandler = async (request: CallableRequest) => {
    // 1. Security: Admin Only (or Super Admin)
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
    
    // Allow any authenticated staff to check health? 
    // Usually Admin only.
    if (request.auth.token.role !== 'super_admin' && request.auth.token.role !== 'tenant_admin') {
        throw new HttpsError('permission-denied', 'Only Admins can perform health checks.');
    }

    const report: any = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        region: process.env.FUNCTION_REGION || 'unknown',
        checks: {}
    };

    // --- A. Database Latency ---
    const dbStart = Date.now();
    try {
        const db = admin.firestore();
        const ref = db.collection('_health_check').doc(`ping_${Date.now()}`);
        await ref.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
        await ref.delete();
        report.checks.db = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch (e: any) {
        report.checks.db = { status: 'failed', error: e.message };
        report.status = 'degraded';
    }

    // --- B. AI Heartbeat (Vertex AI) ---
    const aiStart = Date.now();
    try {
        const project = process.env.GCLOUD_PROJECT || 'mindkindler-84fcf';
        const location = 'europe-west3';
        const vertex_ai = new VertexAI({ project: project, location: location });
        const model = vertex_ai.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "ping" }] }]
        });
        const response = await result.response;
        if (!response.candidates) throw new Error("No candidates returned");
        
        report.checks.ai = { status: 'ok', latencyMs: Date.now() - aiStart };
    } catch (e: any) {
        report.checks.ai = { status: 'failed', error: e.message };
        report.status = 'degraded';
    }

    // --- C. Storage Access ---
    const storeStart = Date.now();
    try {
        const bucket = admin.storage().bucket(); // Default bucket
        const [exists] = await bucket.exists();
        if (!exists) throw new Error("Default bucket not found");
        
        report.checks.storage = { status: 'ok', latencyMs: Date.now() - storeStart };
    } catch (e: any) {
        report.checks.storage = { status: 'failed', error: e.message };
        report.status = 'degraded';
    }

    return report;
};
