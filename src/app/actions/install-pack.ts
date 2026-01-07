"use server";

import { MarketplaceInstaller } from "@/marketplace/installer";
import { MarketplaceManifest } from "@/marketplace/types";
import { revalidatePath } from "next/cache";
// In a real app, import the JSON file directly or fetch from a CMS/DB
// For this vertical slice, we'll import the JSON content we created.
import ukPack from "@/marketplace/catalog/uk_la_pack.json"; 

// Mock Auth Check (Replace with real session validation)
const checkSuperAdmin = async () => {
    // In production: const session = await auth(); if (session.role !== 'SuperAdmin') throw new Error("Unauthorized");
    return true; 
};

export async function installMarketplacePack(tenantId: string, packId: string) {
    await checkSuperAdmin();

    const installer = new MarketplaceInstaller();
    
    // In a real scenario, we'd lookup the pack manifest from a DB or Registry based on ID
    let manifest: MarketplaceManifest | null = null;

    if (packId === 'uk_la_pack') {
        manifest = ukPack as unknown as MarketplaceManifest;
    } else {
        throw new Error(`Pack ${packId} not found in catalog.`);
    }

    try {
        const result = await installer.installPack(tenantId, manifest);
        
        if (!result.success) {
            return { success: false, error: result.errors?.join(', ') };
        }

        // Revalidate key paths so the UI (like Student Form) picks up the new config immediately
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/students');
        
        return { success: true, logs: result.logs };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
