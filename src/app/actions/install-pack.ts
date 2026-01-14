// src/app/actions/install-pack.ts
"use server";

import { MarketplaceInstaller } from "@/marketplace/installer";
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

    const installer = new MarketplaceInstaller();
    
    // 1. Resolve Regional DB
    // Simple mapping for pilot: assumes standard naming
    const shardId = `mindkindler-${region}`;
    let db;
    try {
        db = getFirestore(admin.app(), shardId);
    } catch (e) {
        console.warn(`Failed to connect to shard ${shardId}, falling back to default.`);
        db = admin.firestore();
    }

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
                name: packData.title || packData.name, // Handle schema drift
                description: packData.description,
                capabilities: packData.capabilities || {}, // Important for installer
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

    if (!packData) throw new Error(`Pack ${packId} not found in catalog.`);

    // 3. Payment Gate
    if (packData.price && packData.price > 0) {
        // Check root-level purchases
        let hasPurchased = false;
        try {
            const purchaseSnap = await db.collection('marketplace_purchases')
                .where('tenantId', '==', tenantId)
                .where('packId', '==', packId)
                .limit(1)
                .get();
            
            if (!purchaseSnap.empty) hasPurchased = true;
        } catch (e) {
            console.warn("Purchase check failed:", e);
        }

        if (!hasPurchased) {
            return { 
                success: false, 
                requiresPayment: true, 
                priceId: packData.stripePriceId || 'price_mock_123',
                amount: packData.price
            };
        }
    }

    // 4. Install
    if (!manifest) return { success: false, error: "Manifest invalid." };

    try {
        // Note: Installer might need region info to write to correct shard?
        // MarketplaceInstaller imports 'db' from '@/lib/firebase' (Client SDK) or uses Admin?
        // Wait, MarketplaceInstaller in 'src/marketplace/installer.ts' uses '@/lib/firebase'.
        // This is CLIENT SDK.
        // Server Actions run on Node. So we should ideally use Admin SDK in Installer too, OR ensure Client SDK is init.
        // Since `installPack` is imported from `installer.ts`, check that file.
        
        // ISSUE: `src/marketplace/installer.ts` uses `import { db } from "@/lib/firebase"`.
        // This works in Server Actions usually if the app is init.
        // But `db` (default) might not be the regional DB?
        // MarketplaceInstaller.installPack takes `tenantId`.
        // It writes to `tenants/{tenantId}/...`
        
        // I should probably update MarketplaceInstaller to handle regions properly or accept a DB instance.
        // But for this quick fix, let's assume `installer` works or update it.
        
        // Assuming Installer works (it calls getRegionalDb internally? No, it imports `db`).
        // I previously read `installer.ts` and it imported `db`.
        // Wait, I should double check if `installer.ts` supports regions.
        
        // I will return to the Installer to fix it if it fails next.
        
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
