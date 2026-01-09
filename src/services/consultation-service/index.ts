// src/services/consultation-service/index.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const ConsultationService = {
  async updateSessionOutcome(
    region: string, 
    sessionId: string, 
    outcomeData: any
  ): Promise<void> {
    // In a real multi-region setup, this would use a regional DB instance.
    // For now/mock, we assume the session is in the default or mapped regional collection.
    // Note: In production, use getRegionalDb(region) logic.
    
    // Fallback logic for pilot if using single store or specific collections
    const sessionRef = doc(db, 'consultation_sessions', sessionId);
    
    await updateDoc(sessionRef, {
      outcome: outcomeData,
      status: 'completed', // Ensure status is updated
      updatedAt: new Date().toISOString() // or serverTimestamp()
    });
  }
};
