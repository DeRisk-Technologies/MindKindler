import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from '../student360/audit/audit-logger';

interface ChatRequest {
    sessionId?: string;
    message: string;
    contextMode: 'general' | 'student' | 'case';
    contextId?: string; // studentId or caseId
}

export const handler = async (request: CallableRequest<ChatRequest>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { sessionId, message, contextMode, contextId } = request.data;
    const uid = request.auth.uid;
    const tenantId = request.auth.token.tenantId || 'default';

    // 1. Create or Fetch Session
    const db = admin.firestore();
    let currentSessionId = sessionId;
    
    if (!currentSessionId) {
        const sessionRef = await db.collection('bot_sessions').add({
            tenantId,
            userId: uid,
            mode: 'copilot',
            context: { mode: contextMode, id: contextId },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        currentSessionId = sessionRef.id;
    }

    // 2. Persist User Message
    await db.collection('bot_sessions').doc(currentSessionId).collection('messages').add({
        role: 'user',
        content: message,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Guardian Pre-Check (Safety)
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('hack') || lowerMsg.includes('leak')) {
        throw new HttpsError('permission-denied', 'Safety Violation: Query blocked by Guardian.');
    }

    // 4. RAG Retrieval & Generation (Stubbed for Prototype)
    let responseText = "I don't have enough context for that.";
    let citations = [];

    if (contextMode === 'student' && contextId) {
        responseText = `Based on the record for Student ${contextId}, the last assessment was on Oct 12th. The primary need identified is Dyslexia support.`;
        citations = [{ sourceId: 'doc-1', text: 'Psychological Assessment 2023', relevance: 0.95 }];
    } else {
        responseText = "According to the UK SEN Code of Practice (2015), requests must be processed within 6 weeks.";
        citations = [{ sourceId: 'policy-uk-sen', text: 'UK SEN Code 9.1', relevance: 0.99 }];
    }

    // 5. Persist Bot Response
    const responseRef = await db.collection('bot_sessions').doc(currentSessionId).collection('messages').add({
        role: 'assistant',
        content: responseText,
        citations,
        confidence: 0.95,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 6. Log Provenance
    await logAuditEvent({
        tenantId,
        action: 'ai_generate',
        resourceType: 'student', // or 'system'
        resourceId: contextId || 'general',
        actorId: uid,
        details: 'Copilot Response Generated',
        metadata: { sessionId: currentSessionId, messageId: responseRef.id }
    });

    return { 
        sessionId: currentSessionId, 
        message: { 
            id: responseRef.id, 
            role: 'assistant', 
            text: responseText, 
            citations: citations.map(c => ({ label: c.text, snippet: 'Source content...' })) 
        } 
    };
};
