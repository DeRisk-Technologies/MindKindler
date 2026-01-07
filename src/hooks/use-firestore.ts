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
    const effectiveShard = options?.targetShard || userShardId;

    if (effectiveShard && effectiveShard !== 'default') {
        try {
            // Extract region code from shardId 'mindkindler-uk' -> 'uk'
            // OR getRegionalDb can accept the full DB ID if designed so.
            // Our getRegionalDb helper in lib/firebase takes 'regionId' (e.g. 'mindkindler-uk').
            
            // NOTE: The previous logic assumed shardId was passed to getRegionalDb. 
            // Let's ensure we pass the DB ID or Region Code correctly.
            // getRegionalDb implementation checks `getDbForRegion`.
            // If we pass 'mindkindler-uk', getDbForRegion returns it if it's in the map, 
            // or checks if it's a key. 
            // Actually, getDbForRegion expects a region code (like 'uk') or maps 'default' to default.
            
            // Let's be safe: If effectiveShard starts with 'mindkindler-', it's a DB ID.
            // We can try to extract the region code or pass it as is if getRegionalDb handles it.
            // Looking at regions.ts: 'uk': 'mindkindler-uk'.
            // Looking at firebase.ts: getRegionalDb(regionId) -> calls getDbForRegion(regionId).
            
            // So if effectiveShard is 'mindkindler-uk', getDbForRegion('mindkindler-uk') -> undefined?
            // No, the map keys are 'uk', 'us', etc. 
            // So we need to convert 'mindkindler-uk' -> 'uk' OR ensure getRegionalDb handles DB IDs.
            
            // Let's try to map DB ID back to region code or just assume it is the region code if valid.
            const regionCode = effectiveShard.replace('mindkindler-', '');
            targetDb = getRegionalDb(regionCode);
            
            console.log(`[useFirestoreCollection] Switched to Shard: ${effectiveShard} (Region: ${regionCode})`);
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
        console.error(`Firestore Error (${collectionName} on ${effectiveShard}):`, err);
        setError(err);
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
