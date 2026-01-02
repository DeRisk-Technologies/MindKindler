// src/services/report-service.ts
import { db, functions } from '@/lib/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  addDoc, serverTimestamp, increment 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Report } from '@/types/schema';

const COLLECTION = 'reports'; 

export const ReportService = {
  async createReport(tenantId: string, payload: Partial<Report>): Promise<string> {
    const reportRef = doc(collection(db, COLLECTION));
    const now = serverTimestamp();
    
    await setDoc(reportRef, {
      id: reportRef.id,
      tenantId,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
      content: { sections: [] },
      ...payload
    });
    
    return reportRef.id;
  },

  async getReport(tenantId: string, reportId: string): Promise<Report | null> {
    const ref = doc(db, COLLECTION, reportId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Report) : null;
  },

  async saveDraft(tenantId: string, reportId: string, content: any): Promise<void> {
    const ref = doc(db, COLLECTION, reportId);
    await updateDoc(ref, {
      content,
      updatedAt: serverTimestamp()
    });
  },

  async createVersion(tenantId: string, reportId: string, versionData: any): Promise<string> {
    const reportRef = doc(db, COLLECTION, reportId);
    const versionsCollection = collection(reportRef, 'versions');
    
    // Create version snapshot
    const verRef = await addDoc(versionsCollection, {
        ...versionData,
        createdAt: serverTimestamp()
    });

    // Update main report version counter
    await updateDoc(reportRef, {
        version: increment(1),
        updatedAt: serverTimestamp()
    });

    return verRef.id;
  },

  async requestAiDraft(tenantId: string, reportId: string, context: any): Promise<any> {
    const generateFn = httpsCallable(functions, 'generateClinicalReport');
    // Call server-side function
    const result = await generateFn({
        tenantId,
        ...context
    });
    
    // The function returns generated content. We save it as a draft.
    const generatedContent = (result.data as any); 
    
    const structuredContent = {
        sections: generatedContent.sections || []
    };

    await this.saveDraft(tenantId, reportId, structuredContent);
    return structuredContent;
  },

  async insertCitation(tenantId: string, reportId: string, versionId: string, evidenceId: string, location: number): Promise<string> {
     const reportRef = doc(db, COLLECTION, reportId);
     const citationRef = collection(reportRef, 'citations');
     
     const docRef = await addDoc(citationRef, {
         evidenceId,
         locationIndex: location,
         createdAt: serverTimestamp(),
         status: 'active'
     });

     return docRef.id;
  },

  async signReport(tenantId: string, reportId: string, content: any, signatureHash: string): Promise<void> {
      const reportRef = doc(db, COLLECTION, reportId);
      
      // 1. Create Final Version
      await this.createVersion(tenantId, reportId, {
          content,
          signatureHash,
          type: 'signed_final'
      });

      // 2. Update Main Doc
      // NOTE: We do NOT use auth context here as this runs client side. 
      // Security rules must enforce request.auth.uid matches signedBy if we were passing it.
      // But ideally this should be a cloud function to enforce signer identity.
      // For MVP V1, assuming client trust or subsequent validation.
      
      await updateDoc(reportRef, {
          status: 'signed',
          signedAt: serverTimestamp(),
          signatureHash,
          locked: true
      });
  },

  async exportReport(tenantId: string, reportId: string, options: { redactionLevel: 'none' | 'parent'; format: 'pdf' }) {
      const exportFn = httpsCallable(functions, 'exportReport');
      const result = await exportFn({ tenantId, reportId, ...options });
      return result.data as { downloadUrl: string, exportId: string };
  }
};
