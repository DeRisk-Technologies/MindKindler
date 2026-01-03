import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from '../audit/audit-logger';

// Trigger Patterns (Duplicated from client for server-side enforcement)
const PII_PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    PHONE: /(\+\d{1,3}[- ]?)?\d{10}/
};

const SAFEGUARDING_KEYWORDS = [
    'abuse', 'self-harm', 'suicide', 'neglect', 'violence'
];

interface GuardianCheckRequest {
    content: string;
    context: {
        studentId: string;
        action: string; // 'share', 'report_gen'
    };
}

export const guardianCheck = onCall(async (request: CallableRequest<GuardianCheckRequest>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { content, context } = request.data;
    const uid = request.auth.uid;
    const tenantId = request.auth.token.tenantId || 'default';

    const findings = [];
    let blocked = false;

    // 1. PII Scan
    if (PII_PATTERNS.EMAIL.test(content)) {
        findings.push({ type: 'pii_leak', message: 'Potential Email detected', severity: 'medium' });
    }

    // 2. Safeguarding Scan
    const lowerContent = content.toLowerCase();
    const foundKeywords = SAFEGUARDING_KEYWORDS.filter(w => lowerContent.includes(w));
    
    if (foundKeywords.length > 0) {
        findings.push({ 
            type: 'safeguarding', 
            message: `Safeguarding keyword detected: ${foundKeywords.join(', ')}`, 
            severity: 'critical' 
        });
        
        // Auto-Escalate
        await admin.firestore().collection('alerts').add({
            tenantId,
            type: 'safeguarding_trigger',
            studentId: context.studentId,
            details: `AI Guardian detected keywords: ${foundKeywords.join(', ')}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'new'
        });

        blocked = true; // Block the output if it's unsafe (e.g. sharing sensitive info inappropriately)
    }

    // 3. Log Provenance
    await logAuditEvent({
        tenantId,
        action: 'ai_generate', // Or 'guardian_check'
        resourceType: 'student',
        resourceId: context.studentId,
        actorId: uid,
        details: `Guardian Check: ${findings.length} findings`,
        metadata: { findings, blocked }
    });

    return { findings, blocked };
});
