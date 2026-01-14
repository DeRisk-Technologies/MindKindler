// src/services/report-service.ts
import { db, functions, getRegionalDb } from '@/lib/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  addDoc, serverTimestamp, increment 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Report } from '@/types/schema';

// Helper to determine DB (Global or Regional)
// For Pilot, reports are in Regional DB (mindkindler-uk) if user has region.
const getDb = (region?: string) => region ? getRegionalDb(region) : db;

const COLLECTION = 'reports'; 

export const ReportService = {
  async createReport(tenantId: string, payload: Partial<Report>, region: string = 'uk'): Promise<string> {
    const targetDb = getDb(region);
    const reportRef = doc(collection(targetDb, COLLECTION));
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

  async getReport(tenantId: string, reportId: string, region: string = 'uk'): Promise<Report | null> {
    const targetDb = getDb(region);
    const ref = doc(targetDb, COLLECTION, reportId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Report) : null;
  },

  async saveDraft(tenantId: string, reportId: string, content: any, region: string = 'uk'): Promise<void> {
    // Force lowercase for region to ensure consistency
    const r = region.toLowerCase();
    const targetDb = getDb(r);
    const ref = doc(targetDb, COLLECTION, reportId);
    
    console.log(`[ReportService] Saving draft to DB. Region: ${r}, ID: ${reportId}`);

    // Use setDoc with merge to ensure doc exists
    await setDoc(ref, {
      content,
      updatedAt: serverTimestamp()
    }, { merge: true });
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

    // Use region from context or default to 'uk'
    // Ensure we handle case insensitivity
    const region = (context.region || 'uk').toLowerCase();
    
    console.log(`[ReportService] Received AI Draft. Saving to Region: ${region}`);
    
    await this.saveDraft(tenantId, reportId, structuredContent, region);
    return structuredContent;
  },
  
  // Added for Phase 39: PDF Export
  async exportReport(tenantId: string, reportId: string, options: { redactionLevel: string; format: string }): Promise<{ downloadUrl: string }> {
      const exportFn = httpsCallable(functions, 'exportReport');
      const result = await exportFn({
          tenantId,
          reportId,
          ...options
      });
      return result.data as { downloadUrl: string };
  }
};
