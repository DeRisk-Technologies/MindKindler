// src/integrations/framework/conflicts.ts

export type ConflictResolution = 'keepLocal' | 'acceptIncoming';

export interface SyncConflict {
    id: string;
    entityType: string;
    recordId: string;
    status: 'open' | 'resolved';
    localSnapshot: any;
    remoteSnapshot: any;
    resolution?: ConflictResolution;
}

export function detectConflict(local: any, remote: any): boolean {
    // Simple timestamp check
    if (!local.updatedAt || !remote.updatedAt) return false;
    return new Date(remote.updatedAt) > new Date(local.updatedAt) && local.hasLocalEdits;
}
