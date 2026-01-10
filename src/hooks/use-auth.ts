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
            // 1. Try ID Token Claims (Fastest)
            const token = await getIdTokenResult(u, true); // Force refresh
            let role = token.claims.role as string;
            let tenantId = token.claims.tenantId as string;
            let region = token.claims.region as string;

            // 2. Fetch User Routing (CRITICAL for Sharding)
            // We check 'user_routing' FIRST as it's the source of truth for region/shard
            const routingRef = doc(db, 'user_routing', u.uid);
            let routingDoc = await getDoc(routingRef);
            let routingData = routingDoc.exists() ? routingDoc.data() : null;

            if (routingData) {
                region = region || routingData.region;
                tenantId = tenantId || routingData.tenantId;
                role = role === 'parent' || !role ? routingData.role : role;
            } else if (u.email?.includes('pilot')) {
                // EMERGENCY PILOT FIX: If routing missing for Pilot user, recreate it
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
                console.log("[useAuth] Recreated missing routing for Pilot User");
            }

            // 3. Fallback to Default Firestore Profile
            const userRef = doc(db, 'users', u.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const firestoreData = userDoc.data();
                if (!role || role === 'parent') role = firestoreData.role; 
            } else if (role === 'EPP') {
                // Ensure profile exists in default DB for simple auth checks
                await setDoc(userRef, { role, email: u.email, tenantId }, { merge: true });
            }

            // 4. Construct Extended User
            const extendedUser = u as AuthUser;
            extendedUser.role = role || 'parent'; // Default safe
            extendedUser.tenantId = tenantId || 'default';
            extendedUser.region = region || 'uk'; // Default to UK for pilot safety
            extendedUser.shardId = `mindkindler-${extendedUser.region}`;
            
            console.log(`[useAuth] Resolved: ${u.email} | Role: ${role} | Region: ${region} | Tenant: ${tenantId}`);
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
