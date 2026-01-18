// functions/src/ai/chatWithCopilot.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore";
import { logAuditEvent } from '../student360/audit/audit-logger';
import { retrieveContext } from "./knowledge/retrieve"; 
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI for Generation
const project = process.env.GCLOUD_PROJECT || 'mindkindler-84fcf';
const location = 'europe-west3';
const vertex_ai = new VertexAI({ project: project, location: location });
const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

interface ChatRequest {
    sessionId?: string;
    message: string;
    contextMode: 'general' | 'student' | 'case';
    contextId?: string; // studentId or caseId
}

interface Citation {
    sourceId: string;
    text: string;
    relevance: number;
}

export const handler = async (request: CallableRequest<ChatRequest>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { sessionId, message, contextMode, contextId } = request.data;
    const uid = request.auth.uid;
    const tenantId = request.auth.token.tenantId || 'default';
    const region = request.auth.token.region || 'uk'; 

    const shardId = region === 'default' ? 'default' : `mindkindler-${region}`;
    const db = shardId === 'default' ? admin.firestore() : getFirestore(admin.app(), shardId);

    // 2. Create or Fetch Session
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

    // 3. Persist User Message
    await db.collection('bot_sessions').doc(currentSessionId).collection('messages').add({
        role: 'user',
        content: message,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Guardian Pre-Check (Safety)
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('hack') || lowerMsg.includes('leak')) {
        throw new HttpsError('permission-denied', 'Safety Violation: Query blocked by Guardian.');
    }

    // 5. RAG Retrieval (System + Context)
    let contextText = "";
    let citations: Citation[] = [];
    
    try {
        // A. Check for "How-To" intent (Heuristic)
        const isHowTo = /how (do|to|can) i|where is|help with/i.test(lowerMsg);
        
        let retrievalQuery = `${contextMode} ${contextId ? `(${contextId})` : ''}: ${message}`;
        if (isHowTo) {
            // Bias towards system manual
            retrievalQuery = `system_instruction: ${message}`;
        }

        const searchResults = await retrieveContext(tenantId, retrievalQuery);
        
        if (searchResults.length > 0) {
            contextText = searchResults.map(r => r.text).join('\n\n');
            citations = searchResults.map(r => ({ 
                sourceId: r.documentId || r.id, 
                text: r.metadata?.title || 'Knowledge Base',
                relevance: r.score 
            }));
        }
    } catch (e) {
        console.error("RAG Retrieval Failed", e);
    }

    // 6. LLM Generation with Grounding
    const systemPrompt = `
        You are MindKindler Copilot, an AI assistant for Educational Psychologists using the MindKindler platform.
        
        PLATFORM MAP (Quick Reference):
        - "Case Workbench": Main dashboard for a child. Tabs: Overview, Files, Schedule, Evidence, Reporting.
        - "Live Cockpit": Real-time transcription tool in 'Evidence'.
        - "Direct Work": Launch assessments (WISC-V, BAS3, WIAT-4) in 'Evidence'.
        - "Report Builder": Generate statutory drafts in 'Reporting'.
        - "Guardian": Compliance dashboard.

        Use the provided context (below) to answer accurately. 
        If the user asks "How do I...", prefer using the 'Manual' content in the context.
        If the context is empty, use the PLATFORM MAP above.
        
        Context:
        ${contextText}
    `;

    const requestPrompt = {
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + message }] }]
    };

    let responseText = "I encountered an error generating the response.";
    try {
        const result = await generativeModel.generateContent(requestPrompt);
        const response = await result.response;
        responseText = response.candidates?.[0].content.parts[0].text || responseText;
    } catch (e) {
        console.error("LLM Generation Failed", e);
        responseText = "I'm having trouble connecting to my brain right now. Please try again.";
    }

    // 7. Persist Bot Response
    const responseRef = await db.collection('bot_sessions').doc(currentSessionId).collection('messages').add({
        role: 'assistant',
        content: responseText,
        citations,
        confidence: 0.95,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
        tenantId,
        action: 'ai_generate',
        resourceType: 'student', 
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
