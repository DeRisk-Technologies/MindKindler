// src/ai/knowledge/ingest.ts

import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { KnowledgeDocument, PolicyRuleDraft } from "@/types/schema";

/**
 * Mock ingestion pipeline for Phase 3A & 3C & 3D.
 */
export async function ingestDocument(document: KnowledgeDocument) {
  try {
    // 1. Update status to processing
    await updateDoc(doc(db, "knowledgeDocuments", document.id), {
      status: "processing"
    });

    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    // 2. Mock Text Extraction & Chunking
    let mockContent = `This is a simulated extraction of content from the document "${document.title}". 
    It discusses various regulations regarding ${document.metadata.authority || 'education'}. 
    Section 1 requires reporting of critical incidents within 24 hours. 
    Section 2 discusses special needs accommodations.`;

    if (document.type === 'evidence') {
        mockContent = `Evidence Summary for "${document.title}":
        This verified ${document.metadata.evidenceType} provides strong evidence for early intervention.
        Key finding: 80% improvement in reading scores with phonics.
        Trust Score: ${document.metadata.trustScore}`;
    }
    
    const chunks = [
        mockContent.substring(0, 100),
        mockContent.substring(100)
    ];

    // 3. Mock Embedding & Storage
    const batchPromises = chunks.map(async (chunkText, idx) => {
        const mockEmbedding = Array(768).fill(0).map(() => Math.random()); 
        
        await addDoc(collection(db, "knowledgeChunks"), {
            documentId: document.id,
            content: chunkText,
            embedding: mockEmbedding,
            tags: document.metadata.caseTags || ["general"],
            index: idx
        });
    });

    await Promise.all(batchPromises);

    // 4. Rule Extraction (Phase 3C-1)
    if (document.type === 'rulebook') {
        const draft: PolicyRuleDraft = {
            id: `draft_${Date.now()}`,
            tenantId: document.tenantId || 'default',
            sourceDocumentId: document.id,
            extractedText: "Section 1 requires reporting of critical incidents within 24 hours.",
            citations: [], // Ideally link chunk IDs
            confidence: 0.85,
            status: 'draft',
            structuredDraft: {
                title: `Reporting Requirement from ${document.title}`,
                severity: 'critical',
                triggerCondition: 'safeguarding_recommended',
                remediation: 'Report critical incidents within 24 hours.',
                mode: 'advisory',
                blockActions: false
            },
            createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, "policyRuleDrafts"), draft);
    }

    // 5. Finalize
    await updateDoc(doc(db, "knowledgeDocuments", document.id), {
      status: "indexed"
    });

    return true;

  } catch (error) {
    console.error("Ingestion failed:", error);
    await updateDoc(doc(db, "knowledgeDocuments", document.id), {
      status: "error"
    });
    return false;
  }
}
