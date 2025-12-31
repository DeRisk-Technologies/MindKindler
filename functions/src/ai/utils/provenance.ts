// functions/src/ai/utils/provenance.ts

import * as admin from 'firebase-admin';

// Ensure admin is initialized (it might be in index.ts, but safe to check)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface AiProvenanceMeta {
  tenantId: string;
  studentId?: string;
  flowName: string;
  systemPrompt?: string;
  prompt?: string;
  model: string;
  params?: Record<string, any>;
  responseText?: string;
  parsedOutput?: any;
  latencyMs: number;
  createdBy: string;
}

export async function saveAiProvenance(meta: AiProvenanceMeta): Promise<void> {
  try {
    await db.collection('ai_provenance').add({
      ...meta,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Fail safe: Do not block main flow if logging fails
    console.error('Failed to save AI provenance:', error);
  }
}
