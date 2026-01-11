// src/hooks/use-auth.ts

import { useState, useEffect } from 'react';
import { User, getIdTokenResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";

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
            let tokenResult = await getIdTokenResult(u, true);
            let claims = tokenResult.claims;

            let role = claims.role as string;
            let tenantId = claims.tenantId as string;
            let region = claims.region as string;

            // 2. Resolve User Routing (The Source of Truth)
            const routingRef = doc(db, 'user_routing', u.uid);
            let routingDoc = await getDoc(routingRef);
            let routingData = routingDoc.exists() ? routingDoc.data() : null;

            if (routingData) {
                // AUTO-HEAL: If claims are missing but routing has data, call repair function
                if (!tenantId && routingData.tenantId) {
                    console.warn(`[useAuth] Missing Claims detected (Tenant: ${routingData.tenantId}). Attempting auto-repair...`);
                    try {
                        const functions = getFunctions(undefined, "europe-west3");
                        const setupProfile = httpsCallable(functions, "setupUserProfile");
                        const result = await setupProfile();
                        console.log("[useAuth] Repair Result:", result.data);
                        
                        // Refresh Token AGAIN to get new claims
                        tokenResult = await getIdTokenResult(u, true);
                        claims = tokenResult.claims;
                        tenantId = claims.tenantId as string;
                        region = claims.region as string;
                        role = claims.role as string;
                    } catch (e) {
                        console.error("[useAuth] Repair failed:", e);
                    }
                }
                
                // Fallback to routing data if repair failed or for local state
                region = region || routingData.region;
                tenantId = tenantId || routingData.tenantId;
                role = role || routingData.role;
            } else if (u.email?.includes('pilot')) {
                // EMERGENCY PILOT FIX
                const pilotRegion = 'uk';
                const pilotRole = 'EPP';
                const pilotTenant = 'default';
                
                await setDoc(routingRef, {
                    uid: u.uid,
                    region: pilotRegion,
                    shardId: `mindkindler-${pilotRegion}`,
                    role: pilotRole,
                    tenantId: pilotTenant,
                    email: u.email
                });
                
                region = pilotRegion;
                tenantId = pilotTenant;
                role = pilotRole;
            }

            // 3. Fallback to Default Firestore Profile
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
                Source: ${claims.tenantId ? 'Claims (Secure)' : 'Routing (Legacy - Unsafe for Rules)'}`);
            
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
