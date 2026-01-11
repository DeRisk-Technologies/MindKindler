// src/hooks/use-firestore.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, doc, getDoc, getDocs, Firestore, where, limit } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase"; 
import { usePermissions } from "@/hooks/use-permissions"; 
import { useAuth } from "@/hooks/use-auth";

interface FirestoreCollectionOptions {
  targetShard?: string; 
  filter?: { field: string; operator: any; value: any };
}

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  sortField: string = "createdAt",
  direction: "asc" | "desc" = "desc",
  options?: FirestoreCollectionOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  const { shardId: userShardId, loading: permissionsLoading } = usePermissions();
  const { user } = useAuth(); // Needed for auto-tenant scoping

  const refresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!options?.targetShard && permissionsLoading) return;

    setLoading(true);
    
    let targetDb: Firestore = db;
    let effectiveShard = options?.targetShard || userShardId || 'default';

    if (effectiveShard && effectiveShard !== 'default') {
        try {
            const regionCode = effectiveShard.replace('mindkindler-', '');
            targetDb = getRegionalDb(regionCode);
        } catch (e) {
            console.warn(`[useFirestoreCollection] Failed to load shard ${effectiveShard}, falling back to default.`);
        }
    }

    try {
      let q = query(collection(targetDb, collectionName), orderBy(sortField, direction));
      
      // Auto-Tenant Scope (Fix for Permission Denied)
      const isGlobalCollection = ['organizations', 'tenants', 'user_routing', 'users', 'ai_provenance', 'ai_feedback'].includes(collectionName);
      const isSuperAdmin = user?.role === 'SuperAdmin';
      const hasTenant = user?.tenantId && user?.tenantId !== 'default';

      if (hasTenant && !isSuperAdmin && !isGlobalCollection) {
          // If options.filter already handles tenantId, skip to avoid conflict
          if (!options?.filter || options.filter.field !== 'tenantId') {
               q = query(q, where('tenantId', '==', user.tenantId));
          }
      }
      
      if (options?.filter) {
        q = query(q, where(options.filter.field, options.filter.operator, options.filter.value));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      }, (err) => {
        if (err.code === 'permission-denied') {
             console.warn(`[Permission Denied] Reading ${collectionName} from ${effectiveShard}. This may be expected if user is not verified or query mismatch.`);
             setData([]); 
        } else {
             console.error(`Firestore Error (${collectionName} on ${effectiveShard}):`, err);
             setError(err);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [collectionName, sortField, direction, refreshCount, userShardId, permissionsLoading, options?.targetShard, options?.filter, user]);

  return { data, loading, error, refresh };
}

export function useFirestoreDocument<T = DocumentData>(
    collectionName: string, 
    docId: string,
    targetShard?: string // Optional override
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { shardId: userShardId, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }
        
        if (!targetShard && permissionsLoading) return;

        setLoading(true);

        // Phase 20: Shard Injection
        let targetDb: Firestore = db;
        const effectiveShard = targetShard || userShardId;

        if (effectiveShard && effectiveShard !== 'default') {
             const regionCode = effectiveShard.replace('mindkindler-', '');
             targetDb = getRegionalDb(regionCode);
        }

        const docRef = doc(targetDb, collectionName, docId);
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() } as T);
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Document Error:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId, userShardId, permissionsLoading, targetShard]);

    return { data, loading, error };
}

export function useFirestore() {
    const getDocument = async (collectionName: string, id: string, shard?: string) => {
        try {
            let targetDb = db;
            if (shard && shard !== 'default') {
                const region = shard.replace('mindkindler-', '');
                targetDb = getRegionalDb(region);
            }

            const docRef = doc(targetDb, collectionName, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting document:", error);
            throw error;
        }
    };
    return { getDocument };
}

export async function getCase(id: string) {
    try {
        const docRef = doc(db, "cases", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (e) {
        return null;
    }
}
