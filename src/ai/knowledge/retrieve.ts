// src/ai/knowledge/retrieve.ts

import { db } from "@/lib/firebase";
import { getDocs, collection, query, limit, getDoc, doc, where } from "firebase/firestore";
import { KnowledgeChunk, KnowledgeDocument } from "@/types/schema";

interface SearchResult {
    chunk: KnowledgeChunk;
    document?: KnowledgeDocument;
    score: number;
}

interface RetrievalFilters {
    verifiedOnly?: boolean;
    minTrustScore?: number;
    jurisdiction?: string;
    includeEvidence?: boolean;
}

/**
 * Mock Retrieval Service.
 * Phase 3D Upgrade: Trust-Aware RAG.
 */
export async function retrieveContext(userQuery: string, filters: RetrievalFilters = {}): Promise<SearchResult[]> {
    // Simulate latency
    await new Promise(r => setTimeout(r, 800));

    // Mock: Fetch random chunks for now
    let q = query(collection(db, "knowledgeChunks"), limit(10));
    const snap = await getDocs(q);

    const results: SearchResult[] = [];
    
    for (const d of snap.docs) {
        const chunkData = { id: d.id, ...d.data() } as KnowledgeChunk;
        
        // Fetch parent doc
        const docSnap = await getDoc(doc(db, "knowledgeDocuments", chunkData.documentId));
        let parentDoc: KnowledgeDocument | undefined;
        
        if (docSnap.exists()) {
            parentDoc = { id: docSnap.id, ...docSnap.data() } as KnowledgeDocument;
        }

        // Apply Filters
        if (filters.verifiedOnly && !parentDoc?.metadata.verified) continue;
        if (filters.minTrustScore && (parentDoc?.metadata.trustScore || 0) < filters.minTrustScore) continue;
        if (filters.includeEvidence === false && parentDoc?.type === 'evidence') continue;

        // Mock Scoring Boost
        let score = 0.85 + (Math.random() * 0.1);
        if (parentDoc?.metadata.verified) score += 0.1;
        if ((parentDoc?.metadata.trustScore || 0) > 80) score += 0.05;

        results.push({
            chunk: chunkData,
            document: parentDoc,
            score
        });
    }

    // Sort by score desc and take top 3-5
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function generateRAGResponse(userQuery: string, context: SearchResult[]): Promise<string> {
    // Simulate LLM generation
    await new Promise(r => setTimeout(r, 1500));

    if (context.length === 0) {
        return "I could not find any relevant documents in the Vault to answer your question.";
    }

    // Check if we have evidence
    const evidenceCount = context.filter(c => c.document?.type === 'evidence').length;
    const evidenceNote = evidenceCount > 0 ? `\n\n(Includes ${evidenceCount} verified evidence sources)` : "";

    return `Based on the documents in the vault, here is the answer to "${userQuery}":\n\nThe documents indicate that specific procedures must be followed. For example, one source mentions "${context[0].chunk.content.substring(0, 50)}...". ${evidenceNote}`;
}
