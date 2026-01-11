// src/services/offline-storage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MindKindlerDB extends DBSchema {
  consultation_state: {
    key: string; // 'active_session_id'
    value: string;
  };
  transcripts: {
    key: string; // segment_id
    value: {
      sessionId: string;
      segmentId: string;
      text: string;
      speaker: string;
      timestamp: Date;
      isSynced: boolean;
    };
    indexes: { 'by-session': string };
  };
  events: {
    key: string; // event_id
    value: {
      sessionId: string;
      eventId: string;
      type: string;
      payload: any;
      timestamp: Date;
      isSynced: boolean;
    };
    indexes: { 'by-session': string };
  };
}

const DB_NAME = 'mindkindler-offline-v1';

class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase<MindKindlerDB>>;

  constructor() {
    this.dbPromise = openDB<MindKindlerDB>(DB_NAME, 1, {
      upgrade(db) {
        // State Store
        db.createObjectStore('consultation_state');
        
        // Transcript Store
        const txStore = db.createObjectStore('transcripts', { keyPath: 'segmentId' });
        txStore.createIndex('by-session', 'sessionId');

        // Events Store
        const evStore = db.createObjectStore('events', { keyPath: 'eventId' });
        evStore.createIndex('by-session', 'sessionId');
      },
    });
  }

  // --- Session Management ---
  async setActiveSession(sessionId: string) {
    const db = await this.dbPromise;
    await db.put('consultation_state', sessionId, 'active_session_id');
  }

  async getActiveSession(): Promise<string | undefined> {
    const db = await this.dbPromise;
    return await db.get('consultation_state', 'active_session_id');
  }

  async clearActiveSession() {
    const db = await this.dbPromise;
    await db.delete('consultation_state', 'active_session_id');
  }

  // --- Transcript Operations ---
  async saveTranscriptSegment(segment: any) {
    const db = await this.dbPromise;
    await db.put('transcripts', {
      ...segment,
      isSynced: false // Default to unsynced
    });
  }

  async getSessionTranscript(sessionId: string) {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('transcripts', 'by-session', sessionId);
  }

  async markSegmentSynced(segmentId: string) {
    const db = await this.dbPromise;
    const segment = await db.get('transcripts', segmentId);
    if (segment) {
      segment.isSynced = true;
      await db.put('transcripts', segment);
    }
  }

  // --- Event Operations ---
  async saveEvent(event: any) {
    const db = await this.dbPromise;
    await db.put('events', {
      ...event,
      isSynced: false
    });
  }

  async getSessionEvents(sessionId: string) {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('events', 'by-session', sessionId);
  }

  // --- Sync Utilities ---
  async getPendingSyncItems() {
    const db = await this.dbPromise;
    const allSegments = await db.getAll('transcripts');
    const allEvents = await db.getAll('events');
    
    return {
      segments: allSegments.filter(s => !s.isSynced),
      events: allEvents.filter(e => !e.isSynced)
    };
  }
}

export const OfflineStorage = new OfflineStorageService();
