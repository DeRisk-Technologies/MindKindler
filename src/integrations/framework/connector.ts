// src/integrations/framework/connector.ts

import { StudentImport, TeacherImport } from "../schemas/canonical";

export type EntityType = 'students' | 'teachers' | 'classes' | 'attendance' | 'results';

export interface ConnectorConfig {
    clientId?: string;
    clientSecret?: string;
    endpointUrl?: string;
    // Add other generic config
}

export interface Connector {
    id: string;
    name: string;
    supportedEntityTypes: EntityType[];
    
    init(config: ConnectorConfig): void;
    
    // Pull (Sync)
    pullChanges(entityType: EntityType, cursor?: string): Promise<{ records: any[], nextCursor?: string }>;
    
    // Normalize
    normalizeToCanonical(entityType: EntityType, record: any): StudentImport | TeacherImport | any; // Should return canonical types
}

export interface SyncResult {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
}
