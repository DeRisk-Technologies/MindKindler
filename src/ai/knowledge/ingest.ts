import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { KnowledgeDocument } from "@/types/schema";

export async function ingestDocument(file: File, metadata: any): Promise<string> {
    // 1. Upload logic would go here (Storage)
    // For now, assume URL is generated or placeholder
    const storageUrl = `gs://mock-bucket/${file.name}`;

    // 2. Create Knowledge Document Record
    const docData: Omit<KnowledgeDocument, 'id'> = {
        type: 'evidence',
        title: file.name,
        ownerId: metadata.ownerId || 'system',
        tenantId: metadata.tenantId || 'default',
        visibility: 'private',
        storagePath: storageUrl,
        status: 'uploaded',
        metadata: {
            originalFileName: file.name,
            evidenceType: metadata.evidenceType || 'general',
            trustScore: 100,
            verified: false
        },
        createdAt: new Date().toISOString() // Use string for client compatibility
    };

    const docRef = await addDoc(collection(db, 'knowledgeDocuments'), docData);
    return docRef.id;
}
