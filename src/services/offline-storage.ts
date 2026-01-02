// src/services/offline-storage.ts
import localforage from "localforage";

// Configure storage
localforage.config({
    name: 'MindKindler',
    storeName: 'student360_cache'
});

export const offlineStorage = {
    async setItem<T>(key: string, value: T): Promise<T> {
        try {
            return await localforage.setItem(key, { timestamp: Date.now(), data: value });
        } catch (e) {
            console.warn("Storage write failed", e);
            return value;
        }
    },

    async getItem<T>(key: string): Promise<T | null> {
        try {
            const item = await localforage.getItem<{ timestamp: number, data: T }>(key);
            if (!item) return null;
            // Optional: Expiry logic here (e.g. 7 days)
            return item.data;
        } catch (e) {
            return null;
        }
    },

    async queueAction(action: { type: string, payload: any, id: string }) {
        try {
            const queue = (await this.getItem<any[]>('action_queue')) || [];
            queue.push({ ...action, timestamp: Date.now() });
            await this.setItem('action_queue', queue);
        } catch (e) {
            console.error("Queue failed", e);
        }
    }
};
