import { db } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { KnowledgeDocument } from "@/types/schema";

/**
 * Ingests a document into the Knowledge Base.
 * 1. Uploads file to Firebase Storage (Security Rules Protected).
 * 2. Creates a Firestore record.
 * 3. Triggers background AI processing (via Cloud Functions).
 */
export async function ingestDocument(file: File, metadata: any): Promise<string> {
    const storage = getStorage();
    const tenantId = metadata.tenantId || 'default';
    
    // 1. Path Strategy: tenants/{tenantId}/uploads/{year}/{month}/{filename}
    // This structure helps with Data Residency and Organization.
    const date = new Date();
    const storagePath = `tenants/${tenantId}/uploads/${date.getFullYear()}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
        // 2. Upload File
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        // 3. Create Knowledge Document Record
        // The 'status' is set to 'processing'. A background Cloud Function 
        // (onDocumentCreated) should pick this up, generate embeddings, and update status.
        const docData: Omit<KnowledgeDocument, 'id'> = {
            type: 'evidence',
            title: file.name,
            ownerId: metadata.ownerId || 'system',
            tenantId: tenantId,
            visibility: 'private',
            storagePath: storagePath, // Internal GS Path
            publicUrl: downloadUrl,   // Signed/Public URL (if rules allow)
            status: 'processing',     // Trigger state
            metadata: {
                originalFileName: file.name,
                evidenceType: metadata.evidenceType || 'general',
                trustScore: 100,
                verified: false,
                mimeType: file.type,
                sizeBytes: file.size
            },
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'knowledgeDocuments'), docData);
        return docRef.id;

    } catch (error) {
        console.error("Ingestion Failed:", error);
        throw new Error("Failed to upload and ingest document.");
    }
}
