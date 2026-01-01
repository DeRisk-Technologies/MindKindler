// src/services/offline-queue.ts (Updated for Uploads)

import localforage from "localforage";
import { trackEvent } from "./telemetry-service";
import { UploadService } from "./upload-service"; // Import Upload Service

// Configure dedicated store for mutation queue
const queueStore = localforage.createInstance({
    name: 'MindKindler',
    storeName: 'offline_mutation_queue'
});

export interface QueuedMutation {
    id: string; // UUID
    type: 'createCase' | 'updateCase' | 'addTask' | 'uploadDocument';
    payload: any;
    timestamp: number;
    retryCount: number;
}

export const offlineQueue = {
    async enqueue(type: QueuedMutation['type'], payload: any) {
        const id = crypto.randomUUID();
        const mutation: QueuedMutation = {
            id,
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        await queueStore.setItem(id, mutation);
        console.log(`[Offline] Queued mutation ${type} (${id})`);
        
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.processQueue);
        }
        
        return id;
    },

    async processQueue() {
        if (!navigator.onLine) return;

        console.log("[Sync] Processing offline queue...");
        const keys = await queueStore.keys();
        
        for (const key of keys) {
            const item = await queueStore.getItem<QueuedMutation>(key);
            if (!item) continue;

            try {
                if (item.type === 'uploadDocument') {
                    // Re-hydrate File object? 
                    // Note: IndexedDB can store Blobs. Ensure payload.file is a Blob.
                    await UploadService.uploadFile(item.payload.tenantId, item.payload.file, item.payload.metadata);
                } else {
                    console.log(`[Sync] Replaying ${item.type}...`);
                    // ... other handlers
                }
                
                // Track success telemetry
                await trackEvent({
                    eventName: 'sync_success',
                    tenantId: item.payload.tenantId || 'unknown',
                    metadata: { type: item.type, mutationId: item.id }
                });

                await queueStore.removeItem(key);
            } catch (e) {
                console.error(`[Sync] Failed ${item.type}`, e);
                item.retryCount++;
                if (item.retryCount > 5) {
                    await queueStore.removeItem(key); // Dead Letter
                } else {
                    await queueStore.setItem(key, item);
                }
            }
        }
    }
};
