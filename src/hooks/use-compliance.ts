// src/hooks/use-compliance.ts
import { useState, useEffect, useCallback } from 'react';
import { getRegionalDb } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from './use-auth';

export function useCompliance() {
    const { user } = useAuth();

    const checkConsent = useCallback(async (studentId: string): Promise<{ allowed: boolean; reason?: string }> => {
        if (!user || !studentId) return { allowed: false, reason: "System Error: Missing Context" };
        
        const db = getRegionalDb(user.region);
        
        try {
            // Check for ANY active consent record for this student
            // In a real app, you might check for specific categories (e.g. 'education_share')
            const q = query(
                collection(db, 'consents'),
                where('studentId', '==', studentId),
                where('status', '==', 'granted'),
                limit(1)
            );
            
            const snap = await getDocs(q);
            
            if (snap.empty) {
                return { allowed: false, reason: "Missing Legal Consent" };
            }
            
            return { allowed: true };
        } catch (e) {
            console.error("Compliance Check Failed", e);
            // Fail safe: Block if we can't verify
            return { allowed: false, reason: "Compliance Verification Failed" };
        }
    }, [user]);

    return { checkConsent };
}
