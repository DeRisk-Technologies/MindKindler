// src/services/sync-engine.ts
import { OfflineStorage } from './offline-storage';
import { db, getRegionalDb } from '@/lib/firebase'; // Assuming access to client SDK
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const SyncEngine = {
    
    /**
     * Called by the UI when a new Transcript Segment is finalized.
     * Tries to push to Cloud immediately. If fails, saves locally.
     */
    async pushSegment(region: string, sessionId: string, segment: any) {
        // 1. Always save local first (Golden Rule of Offline-First)
        await OfflineStorage.saveTranscriptSegment({
            ...segment,
            sessionId
        });

        // 2. Try Network Push
        if (navigator.onLine) {
            try {
                const targetDb = getRegionalDb(region);
                const sessionRef = doc(targetDb, 'consultation_sessions', sessionId);
                
                await updateDoc(sessionRef, {
                    transcript: arrayUnion(segment),
                    updatedAt: new Date().toISOString()
                });

                // 3. Mark Synced on Success
                await OfflineStorage.markSegmentSynced(segment.id || segment.segmentId);
                return 'synced';
            } catch (e) {
                console.warn("Sync failed, item queued.", e);
                return 'queued';
            }
        }
        return 'queued';
    },

    /**
     * Called when 'online' event fires.
     * Flushes the Outbox.
     */
    async flushOutbox(region: string, sessionId: string) {
        if (!navigator.onLine) return;

        const pending = await OfflineStorage.getPendingSyncItems();
        if (pending.segments.length === 0 && pending.events.length === 0) return;

        console.log(`[SyncEngine] Flushing ${pending.segments.length} segments...`);

        try {
            const targetDb = getRegionalDb(region);
            const sessionRef = doc(targetDb, 'consultation_sessions', sessionId);

            // Bulk Update (Firestore limits arrayUnion size, but for voice segments usually ok)
            // Ideally we batch these if > 10 items
            if (pending.segments.length > 0) {
                const cleanSegments = pending.segments.map(({ isSynced, sessionId, ...rest }) => rest);
                await updateDoc(sessionRef, {
                    transcript: arrayUnion(...cleanSegments)
                });
                
                // Mark all as synced
                await Promise.all(pending.segments.map(s => OfflineStorage.markSegmentSynced(s.segmentId)));
            }

            console.log("[SyncEngine] Flush Complete.");
        } catch (e) {
            console.error("[SyncEngine] Flush Failed", e);
        }
    }
};
