// src/services/glossary-service/index.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GlossaryDoc } from "@/types/schema";

export const getGlossary = async (tenantId: string, locale: string): Promise<GlossaryDoc | null> => {
    // Structure: tenants/{tenantId}/glossary/locales/{locale}
    // Using deep structure to avoid collection clutter at top level
    try {
        const ref = doc(db, "tenants", tenantId, "glossary", "locales", locale);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: locale, ...snap.data() } as GlossaryDoc;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch glossary", e);
        return null;
    }
};

export const saveGlossaryDraft = async (
    tenantId: string, 
    locale: string, 
    entries: Record<string, string>, 
    userId: string
) => {
    const ref = doc(db, "tenants", tenantId, "glossary", "locales", locale);
    
    const data: Partial<GlossaryDoc> = {
        locale,
        entries,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };

    await setDoc(ref, data, { merge: true });
};

export const publishGlossary = async (
    tenantId: string, 
    locale: string, 
    userId: string
) => {
    const ref = doc(db, "tenants", tenantId, "glossary", "locales", locale);
    
    const data: Partial<GlossaryDoc> = {
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedBy: userId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };

    await setDoc(ref, data, { merge: true });
};
