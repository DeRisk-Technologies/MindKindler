// src/services/report-service.ts
import { db, functions, getRegionalDb } from '@/lib/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  addDoc, serverTimestamp, increment 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Report } from '@/types/schema';

// Helper to determine DB (Global or Regional)
const getDb = (region?: string) => region ? getRegionalDb(region) : db;

const COLLECTION = 'reports'; 

// --- Levenshtein Distance Helper (for Gap Scanner) ---
function levenshtein(a: string, b: string): number {
    const matrix = [];
    let i, j;
    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion/deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

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
    const r = region.toLowerCase();
    const targetDb = getDb(r);
    const ref = doc(targetDb, COLLECTION, reportId);
    
    console.log(`[ReportService] Saving draft to DB. Region: ${r}, ID: ${reportId}`);

    await setDoc(ref, {
      content,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  async requestAiDraft(tenantId: string, reportId: string, context: any): Promise<any> {
    const generateFn = httpsCallable(functions, 'generateClinicalReport');
    
    const result = await generateFn({
        tenantId,
        ...context
    });
    
    const generatedContent = (result.data as any); 
    const structuredContent = {
        sections: generatedContent.sections || []
    };

    const region = (context.region || 'uk').toLowerCase();
    
    console.log(`[ReportService] Received AI Draft. Saving to Region: ${region}`);
    
    await this.saveDraft(tenantId, reportId, structuredContent, region);

    // --- PHASE 42: SNAPSHOT FOR GAP SCANNER ---
    // Save the "Raw AI" version to compare later
    const db = getDb(region);
    await setDoc(doc(db, `${COLLECTION}/${reportId}/ai_snapshots`, 'initial_draft'), {
        sections: structuredContent.sections,
        createdAt: new Date().toISOString(),
        model: 'gemini-2.5-flash'
    });

    return structuredContent;
  },
  
  async exportReport(tenantId: string, reportId: string, options: { redactionLevel: string; format: string }): Promise<{ downloadUrl: string }> {
      const exportFn = httpsCallable(functions, 'exportReport');
      const result = await exportFn({
          tenantId,
          reportId,
          ...options
      });
      return result.data as { downloadUrl: string };
  },

  // --- PHASE 42: Sign & Telemetry ---
  // Added userId to signature for telemetry tracking
  async signReport(tenantId: string, reportId: string, finalContent: any, signatureHash: string, userId: string, region: string = 'uk'): Promise<void> {
      const db = getDb(region);
      const reportRef = doc(db, COLLECTION, reportId);

      // 1. GAP SCANNER: Compare Final vs AI Snapshot
      try {
          const snapshotSnap = await getDoc(doc(db, `${COLLECTION}/${reportId}/ai_snapshots`, 'initial_draft'));
          if (snapshotSnap.exists()) {
              const aiSections = snapshotSnap.data().sections;
              const finalSections = finalContent.sections;
              
              const telemetryBatch: any[] = [];

              finalSections.forEach((finalSec: any) => {
                  const aiSec = aiSections.find((s: any) => s.id === finalSec.id);
                  if (aiSec && aiSec.content && finalSec.content) {
                      // Calculate Distance
                      const dist = levenshtein(aiSec.content, finalSec.content);
                      const maxLen = Math.max(aiSec.content.length, finalSec.content.length);
                      // Avoid divide by zero
                      const percentChanged = maxLen > 0 ? (dist / maxLen) * 100 : 0;

                      // Threshold: Only log if significant change (>10%)
                      if (percentChanged > 10) {
                          telemetryBatch.push({
                              reportId,
                              tenantId,
                              userId, // Added for personalization
                              sectionId: finalSec.id,
                              aiVersion: aiSec.content,
                              finalVersion: finalSec.content,
                              editDistance: percentChanged,
                              timestamp: new Date().toISOString()
                          });
                      }
                  }
              });

              // Save Telemetry
              if (telemetryBatch.length > 0) {
                  await Promise.all(telemetryBatch.map(t => addDoc(collection(db, 'telemetry_report_edits'), t)));
                  console.log(`[Gap Scanner] Logged ${telemetryBatch.length} significant edits.`);
              }
          }
      } catch (e) {
          console.warn("[Gap Scanner] Failed to log telemetry:", e);
      }

      // 2. Finalize Report
      await updateDoc(reportRef, {
          status: 'signed',
          content: finalContent,
          signatureHash,
          signedBy: userId,
          signedAt: new Date().toISOString(),
          locked: true
      });
  }
};
