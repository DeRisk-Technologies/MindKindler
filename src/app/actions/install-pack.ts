// src/app/actions/install-pack.ts
"use server";

import { ServerMarketplaceInstaller } from "@/marketplace/server-installer"; // Use Server Installer
import { MarketplaceManifest } from "@/marketplace/types";
import { revalidatePath } from "next/cache";
import ukPack from "@/marketplace/catalog/uk_la_pack.json"; 
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Init Admin if needed
if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "mindkindler-84fcf" });
}

// Mock Catalog - Fallback
const STATIC_CATALOG: Record<string, any> = {
    'uk_la_pack': { ...ukPack, price: 0 }, 
};

export async function installMarketplacePack(tenantId: string, packId: string, userId: string, region: string = 'uk') {
    if (!tenantId || !userId) throw new Error("Unauthorized");

    // 1. Resolve Regional DB (Admin SDK)
    const shardId = `mindkindler-${region}`;
    let db;
    try {
        db = getFirestore(admin.app(), shardId);
    } catch (e) {
        console.warn(`[Install] Failed to connect to shard ${shardId}, falling back to default.`);
        db = admin.firestore();
    }

    const installer = new ServerMarketplaceInstaller(db);
    
    // 2. Lookup Pack (Dynamic First)
    let packData: any = null;
    let manifest: MarketplaceManifest | null = null;

    try {
        const packSnap = await db.collection('marketplace_items').doc(packId).get();
        if (packSnap.exists) {
            packData = packSnap.data();
            // Ensure manifest has required fields (id, version)
            manifest = {
                id: packData.id,
                version: packData.version,
                name: packData.title || packData.name,
                description: packData.description,
                capabilities: packData.capabilities || {},
                actions: packData.actions || []
            } as MarketplaceManifest;
        }
    } catch (e) {
        console.warn("Firestore pack lookup failed:", e);
    }

    // Fallback to Static
    if (!packData) {
        packData = STATIC_CATALOG[packId];
        if (packData) manifest = packData as MarketplaceManifest;
    }
    
    // Try to synthesize manifest if we have ID but no full catalog entry (e.g. Mock Packs)
    if (!packData && (packId.includes('mock') || packId.includes('sensory'))) {
         console.warn(`[Install] Synthesizing manifest for ${packId}`);
         manifest = {
             id: packId,
             version: '1.0.0',
             name: 'Synthesized Pack',
             description: 'Auto-generated for Pilot',
             capabilities: { countryCode: 'UK', psychometricConfig: {} } // Minimal valid config
         } as any;
    }

    if (!manifest) throw new Error(`Pack ${packId} not found in catalog.`);

    // 3. Payment Gate
    // (Skipped for verifyPurchaseAction flow as it's assumed paid/verified upstream, 
    // but good to keep if called directly. For now we assume caller handles payment check.)

    // 4. Install
    try {
        const result = await installer.installPack(tenantId, manifest);
        
        if (!result.success) {
            return { success: false, error: result.errors?.join(', ') };
        }

        revalidatePath('/dashboard');
        return { success: true, logs: result.logs };

    } catch (e: any) {
        console.error("Install Error:", e);
        return { success: false, error: e.message };
    }
}
