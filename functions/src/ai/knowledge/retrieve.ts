// functions/src/ai/knowledge/retrieve.ts

import * as admin from 'firebase-admin';
import { generateEmbedding } from './embed';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export interface SearchResult {
    id: string;
    score: number;
    text: string;
    [key: string]: any; // Allow other metadata
}

// Similarity Helper (Cosine)
function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function retrieveContext(tenantId: string, query: string, topK: number = 5): Promise<SearchResult[]> {
    // 1. Embed Query
    const queryVector = await generateEmbedding(query);

    // 2. Vector Search
    const chunksSnap = await db.collection(`tenants/${tenantId}/knowledgeChunks`).get();
    
    const scored = chunksSnap.docs.map(doc => {
        const data = doc.data();
        if (!data.embedding) return { id: doc.id, score: -1, text: data.text || "", ...data };
        
        const score = cosineSimilarity(queryVector, data.embedding);
        return { id: doc.id, score, text: data.text || "", ...data };
    });

    // 3. Sort & Slice
    const results = scored
        .filter(s => s.score > 0.6) // Threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return results as SearchResult[];
}
