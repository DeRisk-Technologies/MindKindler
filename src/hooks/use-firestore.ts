"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
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
      // In a real app, you might want to check if the field exists or index is ready
      // For simple prototyping, we might default to simple fetch if sorting fails
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
