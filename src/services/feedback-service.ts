// src/services/feedback-service.ts
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import localforage from "localforage";
import { AiFeedback } from "@/types/schema";

const feedbackQueue = localforage.createInstance({ name: 'MindKindler', storeName: 'ai_feedback_queue' });

export const FeedbackService = {
    async submitFeedback(feedback: Omit<AiFeedback, 'id' | 'createdAt'>) {
        const payload = {
            ...feedback,
            createdAt: new Date().toISOString()
        };

        if (!navigator.onLine) {
            await feedbackQueue.setItem(crypto.randomUUID(), payload);
            console.log("Feedback queued (offline)");
            return;
        }

        try {
            // Write to Firestore
            await addDoc(collection(db, 'ai_feedback'), {
                ...payload,
                createdAt: serverTimestamp()
            });

            // If negative feedback, flag the AI Provenance log
            if (feedback.rating === 'negative' && feedback.traceId) {
                // We use a cloud function trigger ideally, but client-side flag is okay for V1
                // Assuming ai_provenance is writable or we use a separate 'flags' collection
                // For safety, let's just log the feedback. The dashboard will join them.
            }
        } catch (e) {
            console.error("Feedback submit failed", e);
            // Fallback queue
            await feedbackQueue.setItem(crypto.randomUUID(), payload);
        }
    },

    async processOfflineQueue() {
        if (!navigator.onLine) return;
        
        const keys = await feedbackQueue.keys();
        for (const key of keys) {
            const item = await feedbackQueue.getItem<any>(key);
            if (item) {
                try {
                    await addDoc(collection(db, 'ai_feedback'), {
                        ...item,
                        createdAt: serverTimestamp(),
                        synced: true
                    });
                    await feedbackQueue.removeItem(key);
                } catch (e) {
                    console.error("Sync failed for item", key);
                }
            }
        }
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => FeedbackService.processOfflineQueue());
}
