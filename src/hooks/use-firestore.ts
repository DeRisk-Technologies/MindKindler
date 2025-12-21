"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  sortField: string = "createdAt",
  direction: "asc" | "desc" = "desc"
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName), orderBy(sortField, direction));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      }, (err) => {
        console.error("Firestore Error:", err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [collectionName, sortField, direction]);

  return { data, loading, error };
}

export function useFirestoreDocument<T = DocumentData>(
    collectionName: string, 
    docId: string
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, collectionName, docId);
        
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
    }, [collectionName, docId]);

    return { data, loading, error };
}

export function useFirestore() {
    const getDocument = async (collectionName: string, id: string) => {
        try {
            const docRef = doc(db, collectionName, id);
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
    
    // Add other helpers as needed (add, update, delete)
    return { getDocument };
}

export async function getCase(id: string) {
    // Server-side safe fetching (if needed) or simple client fetch wrapper
    // Since we're using client SDK mostly:
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
