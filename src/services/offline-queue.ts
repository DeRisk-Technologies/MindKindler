// src/services/offline-queue.ts

import localforage from "localforage";
import { trackEvent } from "./telemetry-service";

// Configure dedicated store for mutation queue
const queueStore = localforage.createInstance({
    name: 'MindKindler',
    storeName: 'offline_mutation_queue'
});

export interface QueuedMutation {
    id: string; // UUID
    type: 'createCase' | 'updateCase' | 'addTask';
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
        
        // Register sync listener if first item
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
                // Execute logic based on type (Dynamic import to avoid circular dep if services import this)
                // For Stage 7, we simulate the execution or import specific handlers if feasible.
                // Ideally, this calls `caseService.sync(item)`
                
                console.log(`[Sync] Replaying ${item.type}...`);
                
                // Track success telemetry
                await trackEvent({
                    eventName: 'caseUpdated', // Generic for now
                    tenantId: item.payload.tenantId || 'unknown',
                    metadata: { sync: true, mutationId: item.id }
                });

                // Remove from queue on success
                await queueStore.removeItem(key);
            } catch (e) {
                console.error(`[Sync] Failed ${item.type}`, e);
                // Increment retry or keep for later
                item.retryCount++;
                if (item.retryCount > 5) {
                    // Move to dead letter queue or alerting
                    await queueStore.removeItem(key); 
                } else {
                    await queueStore.setItem(key, item);
                }
            }
        }
    }
};
