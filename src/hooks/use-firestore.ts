// src/hooks/use-firestore.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, doc, getDoc, getDocs, Firestore, where, limit } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase"; // Import regional loader
import { usePermissions } from "@/hooks/use-permissions"; // Context-Aware Sharding

interface FirestoreCollectionOptions {
  targetShard?: string; // Explicitly override shard (e.g. for Admin viewing other regions)
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
  
  // Phase 20: Shard Injection
  // We get the current user's shard context. 
  // If options.targetShard is provided, we use that instead.
  const { shardId: userShardId, loading: permissionsLoading } = usePermissions();

  const refresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    // If we are waiting for permissions AND no explicit shard is provided, wait.
    // If explicit shard is provided, we can proceed.
    if (!options?.targetShard && permissionsLoading) return;

    setLoading(true);
    
    // Determine Target DB
    // Priority: 
    // 1. Explicit options.targetShard (e.g. Admin selects 'uk')
    // 2. User's assigned shard (e.g. Regional Admin locked to 'uk')
    // 3. Default DB
    
    let targetDb: Firestore = db;
    let effectiveShard = options?.targetShard || userShardId || 'default';

    // If appointments is global or sharded, we need to be careful.
    // Appointments often cross-reference so currently we might default to main DB if not fully sharded.
    // BUT for now, let's respect the shard logic.

    if (effectiveShard && effectiveShard !== 'default') {
        try {
            const regionCode = effectiveShard.replace('mindkindler-', '');
            targetDb = getRegionalDb(regionCode);
            // console.log(`[useFirestoreCollection] Switched to Shard: ${effectiveShard} (Region: ${regionCode})`);
        } catch (e) {
            console.warn(`[useFirestoreCollection] Failed to load shard ${effectiveShard}, falling back to default.`);
        }
    }

    try {
      let q = query(collection(targetDb, collectionName), orderBy(sortField, direction));
      
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
        // Suppress specific permissions error for non-critical widgets
        if (err.code === 'permission-denied') {
             console.warn(`[Permission Denied] Reading ${collectionName} from ${effectiveShard}. This may be expected if user is not verified.`);
             setData([]); // clear data gracefully
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
  }, [collectionName, sortField, direction, refreshCount, userShardId, permissionsLoading, options?.targetShard, options?.filter]);

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
    // This helper is imperative (async). 
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
    // Legacy helper - assumes default DB for cases unless updated.
    // TODO: Update to support sharded cases.
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
