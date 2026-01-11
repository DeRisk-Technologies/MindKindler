// src/hooks/use-auth.ts

import { useState, useEffect } from 'react';
import { User, getIdTokenResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export interface AuthUser extends User {
    role?: string;
    tenantId?: string;
    region?: string;
    shardId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
          try {
            // 1. Force Refresh Token to get latest Custom Claims
            const tokenResult = await getIdTokenResult(u, true);
            const claims = tokenResult.claims;

            let role = claims.role as string;
            let tenantId = claims.tenantId as string;
            let region = claims.region as string;

            // 2. Resolve User Routing (The Source of Truth)
            const routingRef = doc(db, 'user_routing', u.uid);
            let routingDoc = await getDoc(routingRef);
            let routingData = routingDoc.exists() ? routingDoc.data() : null;

            if (routingData) {
                // If claims are missing but routing has data, we prioritize routing for UI 
                // BUT we know Security Rules will fail until claims sync.
                if (!tenantId && routingData.tenantId) {
                    console.warn(`[useAuth] Tenant mismatch! Claims: ${tenantId}, Routing: ${routingData.tenantId}. Sync required.`);
                }
                
                region = region || routingData.region;
                tenantId = tenantId || routingData.tenantId;
                role = role || routingData.role;
            }

            // 3. Fallback to default DB Profile
            if (!role || !tenantId) {
                const userRef = doc(db, 'users', u.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const profileData = userDoc.data();
                    role = role || profileData.role;
                    tenantId = tenantId || profileData.tenantId;
                }
            }

            // 4. Construct Extended User
            const extendedUser = u as AuthUser;
            extendedUser.role = role || 'parent';
            extendedUser.tenantId = tenantId || 'default';
            extendedUser.region = region || 'uk'; 
            extendedUser.shardId = `mindkindler-${extendedUser.region}`;
            
            console.log(`[useAuth] Active Identity: 
                Email: ${u.email}
                Role: ${extendedUser.role} 
                Tenant: ${extendedUser.tenantId} 
                Region: ${extendedUser.region}
                Source: ${claims.tenantId ? 'Claims (Secure)' : 'Routing (Legacy)'}`);
            
            setUser(extendedUser);
          } catch (err) {
            console.error("[useAuth] Error fetching user details:", err);
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
