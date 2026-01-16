// src/ai/knowledge/retrieve.ts
import { functions } from "@/lib/firebase"; // Assumes firebase.ts exports functions
import { httpsCallable } from "firebase/functions";
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
    tenantId?: string; // Essential for data isolation
}

/**
 * Retrieves context from the Knowledge Base using Semantic Search.
 * Calls the secure Cloud Function 'searchKnowledgeBase'.
 */
export async function retrieveContext(userQuery: string, filters: RetrievalFilters = {}): Promise<SearchResult[]> {
    try {
        // We use a Cloud Function because generating embeddings requires a secret API Key (Gemini/OpenAI)
        // which cannot be exposed on the client.
        const searchFn = httpsCallable(functions, 'searchKnowledgeBase');
        
        const response = await searchFn({
            query: userQuery,
            filters: filters
        });

        // The Cloud Function returns structured results
        return (response.data as any).results as SearchResult[];
    } catch (error) {
        console.warn("Vector Search unavailable, falling back to basic keyword search simulation.", error);
        // Fallback or empty return to prevent UI crash
        return [];
    }
}

/**
 * Generates an answer using the retrieved context.
 * Calls the secure Cloud Function 'chatWithCopilot' (RAG Pipeline).
 */
export async function generateRAGResponse(userQuery: string, context: SearchResult[]): Promise<string> {
    try {
        const chatFn = httpsCallable(functions, 'chatWithCopilot');
        
        // We send the Context explicitly to the LLM (Context Injection)
        // Or we can let the Cloud Function re-fetch it if we just pass the query.
        // Passing context is more deterministic if we already have it.
        const response = await chatFn({
            message: userQuery,
            contextOverride: context.map(c => c.chunk.content).join("\n\n---\n\n")
        });

        return (response.data as any).reply;
    } catch (error) {
        console.error("RAG Generation Failed", error);
        return "I'm having trouble connecting to the AI Co-pilot right now. Please try again.";
    }
}
