// src/hooks/use-auth.ts

import { useState, useEffect } from 'react';
import { User, getIdTokenResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface AuthUser extends User {
    role?: string;
    tenantId?: string;
    region?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
          try {
            // 1. Try ID Token Claims (Fastest)
            const token = await getIdTokenResult(u, true); // Force refresh
            let role = token.claims.role as string;
            let tenantId = token.claims.tenantId as string;
            let region = token.claims.region as string;

            // 2. Fallback to Firestore Profile (Reliable for fresh signups)
            const userRef = doc(db, 'users', u.uid);
            const userDoc = await getDoc(userRef);
            let firestoreData: any = {};
            
            if (userDoc.exists()) {
                firestoreData = userDoc.data();
                if (!role || role === 'parent') role = firestoreData.role; // Prefer Firestore if token is default 'parent'
                tenantId = tenantId || firestoreData.tenantId;
                region = region || firestoreData.region;
            }

            // --- PILOT AUTO-FIX ---
            // If user is clearly an EPP (based on email) but has 'parent' role (default), upgrade them.
            if ((u.email?.includes('helena') || u.email?.includes('mindsuk.com')) && (!role || role === 'parent' || role === 'ParentUser')) {
                 console.log(`[useAuth] Detected Pilot EPP with wrong role (${role}). Auto-correcting...`);
                 role = 'EPP';
                 tenantId = tenantId || `practice_${u.uid}`;
                 
                 // Write back to Firestore so Rules work
                 try {
                     await updateDoc(userRef, { 
                         role: 'EPP', 
                         tenantId: tenantId,
                         updatedAt: new Date().toISOString()
                     });
                     console.log("[useAuth] Auto-correction saved to Firestore.");
                 } catch (writeErr) {
                     console.warn("[useAuth] Failed to auto-correct Firestore:", writeErr);
                 }
            }
            
            // Fallback for Independent EPPs without Tenant ID
            if (role === 'EPP' && !tenantId) {
                tenantId = `practice_${u.uid}`;
            }

            // 3. Construct Extended User
            const extendedUser = u as AuthUser;
            extendedUser.role = role;
            extendedUser.tenantId = tenantId;
            extendedUser.region = region;
            
            console.log(`[useAuth] Resolved User: ${u.email} | Role: ${role} | Tenant: ${tenantId}`);
            setUser(extendedUser);
          } catch (err) {
            console.error("[useAuth] Error fetching user details:", err);
            // Fallback to basic user
            setUser(u as AuthUser);
          }
      } else {
          setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
