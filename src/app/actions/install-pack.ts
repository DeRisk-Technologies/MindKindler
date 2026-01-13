"use server";

import { MarketplaceInstaller } from "@/marketplace/installer";
import { MarketplaceManifest } from "@/marketplace/types";
import { revalidatePath } from "next/cache";
import ukPack from "@/marketplace/catalog/uk_la_pack.json"; 
import { adminDb } from "@/lib/firebase-admin"; // Assuming we have this, or init admin here

// Mock Catalog - In Prod, fetch from `marketplace_items` collection
const CATALOG: Record<string, any> = {
    'uk_la_pack': { ...ukPack, price: 0 }, // Free
    'premium_autism_pack': { id: 'premium_autism_pack', title: 'ADOS-2 Suite', price: 4900 } // £49.00
};

export async function installMarketplacePack(tenantId: string, packId: string, userId: string) {
    if (!tenantId || !userId) throw new Error("Unauthorized");

    const installer = new MarketplaceInstaller();
    
    // 1. Lookup Pack
    // const packDoc = await adminDb.collection('marketplace_items').doc(packId).get();
    // const packData = packDoc.data();
    const packData = CATALOG[packId];

    if (!packData) throw new Error(`Pack ${packId} not found.`);

    // 2. Payment Gate
    if (packData.price && packData.price > 0) {
        // Check if purchased
        // Ideally: collection('tenants').doc(tenantId).collection('purchases').doc(packId)
        // For Pilot, we'll verify against a simpler list or assume false if not found
        
        let hasPurchased = false;
        try {
            const purchaseSnap = await adminDb.collection('tenants')
                .doc(tenantId)
                .collection('purchases')
                .where('packId', '==', packId)
                .where('status', '==', 'completed')
                .get();
            
            if (!purchaseSnap.empty) hasPurchased = true;
        } catch (e) {
            console.warn("Purchase check failed, assuming false for safety", e);
        }

        if (!hasPurchased) {
            // Signal Frontend to Redirect
            return { 
                success: false, 
                requiresPayment: true, 
                priceId: packData.stripePriceId || 'price_mock_123',
                amount: packData.price
            };
        }
    }

    // 3. Install
    // In a real scenario, we'd load the full manifest here.
    // For 'premium_autism_pack', we don't have the JSON yet, so we block/mock.
    let manifest: MarketplaceManifest | null = null;
    
    if (packId === 'uk_la_pack') {
        manifest = ukPack as unknown as MarketplaceManifest;
    } else {
        // If we passed payment but don't have the manifest loaded in code:
        return { success: false, error: "Pack content not found on server." };
    }

    try {
        const result = await installer.installPack(tenantId, manifest);
        
        if (!result.success) {
            return { success: false, error: result.errors?.join(', ') };
        }

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/settings');
        return { success: true, logs: result.logs };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
