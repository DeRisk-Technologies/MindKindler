// functions/src/ai/knowledge/embed.ts

import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || 'mindkindler-84fcf';
const location = 'europe-west3'; 
const vertex_ai = new VertexAI({ project: project, location: location });

// Use Gecko model for embeddings
const model = 'text-embedding-004';

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const generativeModel = vertex_ai.getGenerativeModel({ model: model });
        
        // Cast to 'any' to bypass strict TS check on 'embedContent'
        // which exists in the runtime SDK but might be missing in @types
        const resp = await (generativeModel as any).embedContent(text);
        
        if (!resp.embedding?.values) {
            throw new Error("No embedding values returned");
        }

        return resp.embedding.values;
    } catch (e) {
        console.error("Embedding Generation Failed", e);
        return Array(768).fill(0); 
    }
}
