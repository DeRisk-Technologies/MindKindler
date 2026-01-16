// src/lib/notifications.ts
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc, writeBatch, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Notification } from "@/types/schema";

/**
 * Creates a notification in the database.
 * NOTE: The actual delivery (Push/Email) is handled by a Cloud Function trigger
 * on the 'notifications' collection, which checks user preferences.
 */
export async function sendNotification(payload: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    try {
        await addDoc(collection(db, "notifications"), {
            ...payload,
            read: false,
            createdAt: serverTimestamp() // Use server timestamp for consistency
        });
    } catch (error) {
        console.error("Failed to write notification", error);
        // We do not throw here to prevent breaking the main flow (e.g. Case Assignment)
        // just because a notification failed to write.
    }
}

export async function markAsRead(notificationId: string) {
    try {
        await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (error) {
         console.error("Failed to mark notification as read", error);
    }
}

export async function markAllAsRead(userId: string) {
    try {
        const q = query(
            collection(db, "notifications"), 
            where("recipientUserId", "==", userId), 
            where("read", "==", false)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
            batch.update(d.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Failed to mark all as read", error);
    }
}
