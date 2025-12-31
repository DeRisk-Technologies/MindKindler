// src/integrations/framework/syncEngine.ts

import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { Connector, SyncResult, EntityType } from "./connector";
import { OneRosterConnector } from "../connectors/oneroster"; // Mock import

// Registry
const connectors: Record<string, Connector> = {
    'oneroster': new OneRosterConnector(),
    // 'edfi': new EdFiConnector()
};

export async function runSync(integrationId: string, entityTypes: EntityType[], mode: 'full' | 'incremental' = 'incremental'): Promise<string> {
    // 1. Create Sync Run
    const runRef = await addDoc(collection(db, "syncRuns"), {
        integrationId,
        runType: "manual",
        mode,
        entityTypes,
        status: "running",
        startedAt: new Date().toISOString(),
        counts: { created: 0, updated: 0, errors: 0 }
    });

    // 2. Execute (Async in real world, awaited here for mock flow)
    const connector = connectors['oneroster']; // Force mock for now
    let totalStats: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0 };

    for (const type of entityTypes) {
        try {
            // Get Cursor
            const cursorDoc = await getDoc(doc(db, "syncCursors", `${integrationId}_${type}`));
            const cursor = mode === 'incremental' ? cursorDoc.data()?.cursor : undefined;

            // Pull
            const { records, nextCursor } = await connector.pullChanges(type, cursor);

            // Process (Mock Apply)
            const stats = await applyChanges(type, records);
            
            // Update Stats
            totalStats.created += stats.created;
            totalStats.updated += stats.updated;

            // Save Cursor
            if (nextCursor) {
                // await setDoc(doc(db, "syncCursors", `${integrationId}_${type}`), { cursor: nextCursor, lastSyncAt: new Date().toISOString() });
            }
        } catch (e) {
            console.error(`Sync failed for ${type}`, e);
            totalStats.errors++;
        }
    }

    // 3. Complete
    await updateDoc(doc(db, "syncRuns", runRef.id), {
        status: totalStats.errors > 0 ? "partial" : "completed",
        completedAt: new Date().toISOString(),
        counts: totalStats
    });

    return runRef.id;
}

async function applyChanges(type: EntityType, records: any[]): Promise<SyncResult> {
    // Mock Write to Firestore
    // In real implementation: Check existing by ID -> Conflict Resolution -> Update/Create
    
    // Simulating updates
    return {
        created: records.length,
        updated: 0,
        skipped: 0,
        errors: 0
    };
}
