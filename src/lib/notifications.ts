// src/lib/notifications.ts

import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc, writeBatch, query, where, getDocs } from "firebase/firestore";
import { Notification } from "@/types/schema";

export async function sendNotification(payload: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    // 1. Check Preferences (Mock)
    // In real app, fetch NotificationPreferences for recipientUserId
    // const prefs = await getDoc(...)
    // if (!prefs.categories[payload.category]) return;

    // 2. Write to Firestore
    await addDoc(collection(db, "notifications"), {
        ...payload,
        read: false,
        createdAt: new Date().toISOString()
    });

    // 3. External Channels (Mock)
    console.log(`[Notification] Sent ${payload.type} to ${payload.recipientUserId}: ${payload.title}`);
}

export async function markAsRead(notificationId: string) {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export async function markAllAsRead(userId: string) {
    const q = query(collection(db, "notifications"), where("recipientUserId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { read: true });
    });
    await batch.commit();
}
