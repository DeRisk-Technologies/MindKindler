// functions/src/ai/knowledge/indexDocument.ts

import * as admin from 'firebase-admin';
import { generateEmbedding } from './embed';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Vector Store Configuration
// Note: We are using Firestore Vector Search (via extension or manual cosine if dataset < 10k).
// For Production scale > 1M, we would push to Vertex AI Vector Search endpoint here.
// User Guide: Ensure "Firestore Vector Search" extension is installed OR 
// we implement the manual vector field for potential future export.

export async function indexDocumentChunk(
    tenantId: string, 
    documentId: string, 
    textChunk: string, 
    metadata: any
) {
    // 1. Generate Vector
    const vector = await generateEmbedding(textChunk);

    // 2. Store in 'knowledgeChunks' collection
    // We add a 'embedding' field compatible with Firestore Vector Search
    await db.collection(`tenants/${tenantId}/knowledgeChunks`).add({
        documentId,
        text: textChunk,
        embedding: vector, // Vector field
        metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Add a hash for dedupe if needed
    });

    console.log(`[Indexer] Chunk indexed for doc ${documentId}`);
}
