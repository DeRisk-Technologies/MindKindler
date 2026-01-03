// src/services/document-staging-service.ts
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ProvenanceMetadata } from '@/types/schema';

export interface ExtractedField {
  key: string; // e.g., "identity.dateOfBirth"
  value: any;
  confidence: number;
  location?: { page: number; box: number[] }; // Bounding box for highlighting
  rawText?: string;
}

export interface StagedDocument {
  id: string;
  tenantId: string;
  studentId?: string; // If matched to an existing student
  fileRef: string; // Storage path
  fileName: string;
  mimeType: string;
  status: 'uploading' | 'processing' | 'ready_for_review' | 'processed' | 'error';
  documentType: 'birth_certificate' | 'school_report' | 'assessment' | 'legal_custody' | 'other';
  extractedData: Record<string, ExtractedField>;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Service to manage the lifecycle of uploaded documents for extraction.
 */
export class DocumentStagingService {
  private static COLLECTION = 'document_staging';

  static async createStagedDocument(
    tenantId: string, 
    fileData: Pick<StagedDocument, 'fileName' | 'fileRef' | 'mimeType' | 'uploadedBy'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, this.COLLECTION), {
      ...fileData,
      tenantId,
      status: 'uploading',
      extractedData: {},
      uploadedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  static async updateExtractionResults(
    docId: string, 
    documentType: StagedDocument['documentType'],
    extractedFields: ExtractedField[]
  ): Promise<void> {
    // Convert array to map for easier access
    const dataMap: Record<string, ExtractedField> = {};
    extractedFields.forEach(f => {
      dataMap[f.key] = f;
    });

    await updateDoc(doc(db, this.COLLECTION, docId), {
      status: 'ready_for_review',
      documentType,
      extractedData: dataMap
    });
  }

  /**
   * Applies accepted fields from staging to the actual Student Record.
   * This is the "Merge" step.
   */
  static async applyExtractionToStudent(
    studentId: string,
    stagedDocId: string,
    acceptedFields: string[] // List of keys to apply, e.g. ["identity.dateOfBirth"]
  ): Promise<void> {
    const stagedDocRef = doc(db, this.COLLECTION, stagedDocId);
    const stagedSnap = await getDoc(stagedDocRef);
    if (!stagedSnap.exists()) throw new Error("Staged doc not found");

    const stagedData = stagedSnap.data() as StagedDocument;
    
    // We update the student record
    // This requires mapping the flat keys "identity.dateOfBirth" to the nested object structure
    // And wrapping them in ProvenanceField format
    
    const updates: Record<string, any> = {};
    
    acceptedFields.forEach(key => {
      const extraction = stagedData.extractedData[key];
      if (!extraction) return;

      const metadata: ProvenanceMetadata = {
        source: 'ocr',
        sourceId: stagedDocId,
        confidence: extraction.confidence,
        verified: false, // User accepted the extraction, but it might still need human verification depending on policy. Let's assume acceptance = pre-verified or pending verify. 
                         // Actually, usually "User accepted" means they looked at it. But "Verified" usually implies "Checked against source of truth". 
                         // For OCR, the doc IS the source of truth. So we can mark verified if confidence is high or user explicitly confirms.
        verifiedBy: stagedData.uploadedBy, // The user who clicked "Apply"
        verifiedAt: new Date().toISOString()
      };

      // Construct update path. In Firestore update(), "identity.dateOfBirth" works directly.
      // But we need to update the whole object { value: '...', metadata: {...} }
      updates[key] = {
        value: extraction.value,
        metadata
      };
    });

    // Update Student
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, updates);

    // Update Staged Doc status
    await updateDoc(stagedDocRef, {
      status: 'processed',
      studentId
    });
  }
}
