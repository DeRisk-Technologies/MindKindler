// src/marketplace/installer.ts

import { db, auth } from "@/lib/firebase";
import { addDoc, collection, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { MarketplaceManifest, InstallAction } from "./types";
import { InstalledPack } from "@/types/schema";

export async function installPack(manifest: MarketplaceManifest): Promise<string> {
    console.log(`[Installer] Installing pack: ${manifest.id}`);

    const artifacts: { collection: string; id: string }[] = [];
    const tenantId = "default";
    const userId = auth.currentUser?.uid || "unknown";

    try {
        for (const action of manifest.actions) {
            let ref;
            if (action.type === 'createPolicyRule') {
                ref = await addDoc(collection(db, "policyRules"), {
                    ...action.payload,
                    tenantId,
                    createdAt: new Date().toISOString(),
                    enabled: true,
                    status: 'active'
                });
                artifacts.push({ collection: "policyRules", id: ref.id });
            } else if (action.type === 'createTrainingModule') {
                ref = await addDoc(collection(db, "trainingModules"), {
                    ...action.payload,
                    tenantId,
                    createdAt: new Date().toISOString(),
                    status: 'published'
                });
                artifacts.push({ collection: "trainingModules", id: ref.id });
            }
            // Add other types as needed
        }

        const installRecord: InstalledPack = {
            id: `install_${Date.now()}`, // Temp ID, firestore overwrites
            tenantId,
            packId: manifest.id,
            version: manifest.version,
            installedAt: new Date().toISOString(),
            installedByUserId: userId,
            status: 'installed',
            artifacts
        };

        const installRef = await addDoc(collection(db, "installedPacks"), installRecord);
        return installRef.id;

    } catch (e) {
        console.error("Installation failed", e);
        // Rollback created artifacts if partial failure (simplified)
        throw e;
    }
}

export async function rollbackPack(installedPackId: string): Promise<void> {
    console.log(`[Installer] Rolling back: ${installedPackId}`);
    
    const snap = await getDoc(doc(db, "installedPacks", installedPackId));
    if (!snap.exists()) throw new Error("Install record not found");
    
    const record = snap.data() as InstalledPack;
    if (record.status === 'rolledBack') return;

    // Delete artifacts
    for (const artifact of record.artifacts) {
        try {
            await deleteDoc(doc(db, artifact.collection, artifact.id));
        } catch (e) {
            console.warn(`Failed to delete artifact ${artifact.id}`, e);
        }
    }

    await updateDoc(doc(db, "installedPacks", installedPackId), { status: "rolledBack" });
}
