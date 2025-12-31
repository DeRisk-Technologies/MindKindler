// src/services/translation-service/index.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { TranslationOverrideDoc } from "@/types/schema";

export const getTranslationOverride = async (tenantId: string, locale: string, namespace: string): Promise<TranslationOverrideDoc | null> => {
    // We store overrides at: tenants/{tenantId}/i18n/{namespace}/locales/{locale}
    // Note: The path structure in the prompt was tenants/{tenantId}/i18n/{namespace}/locales/{locale}
    // Let's adhere to that deep structure for namespace isolation.
    try {
        const ref = doc(db, "tenants", tenantId, "i18n", namespace, "locales", locale);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: namespace, ...snap.data() } as TranslationOverrideDoc;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch translation override", e);
        return null;
    }
};

export const saveTranslationDraft = async (
    tenantId: string, 
    locale: string, 
    namespace: string, 
    entries: Record<string, string>, 
    userId: string
) => {
    const ref = doc(db, "tenants", tenantId, "i18n", namespace, "locales", locale);
    
    // We do a merge, but for entries we probably want to merge or replace?
    // Usually draft saving replaces the current draft entries state for that key set.
    // To support partial updates, we'd use dot notation, but for a simplified editor we save the whole map.
    
    const data: Partial<TranslationOverrideDoc> = {
        locale,
        namespace,
        entries,
        status: 'draft', // explicit draft status on save
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };

    await setDoc(ref, data, { merge: true });
};

export const publishTranslation = async (
    tenantId: string, 
    locale: string, 
    namespace: string, 
    userId: string
) => {
    const ref = doc(db, "tenants", tenantId, "i18n", namespace, "locales", locale);
    
    const data: Partial<TranslationOverrideDoc> = {
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedBy: userId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };

    await setDoc(ref, data, { merge: true });
};

// Helper to get ALL published overrides for a locale (to load at runtime)
// Since structure is deep: tenants/{id}/i18n/{ns}/locales/{locale}
// This requires a Collection Group Query if we want all namespaces at once, OR we iterate known namespaces.
// Given we know namespaces (common, navigation, roles), iterating is safer/cheaper than CGQ on 'locales'.
export const getAllPublishedOverrides = async (tenantId: string, locale: string, namespaces: string[]) => {
    const results: Record<string, Record<string, string>> = {};
    
    // Parallel fetch
    await Promise.all(namespaces.map(async (ns) => {
        const ref = doc(db, "tenants", tenantId, "i18n", ns, "locales", locale);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as TranslationOverrideDoc;
            if (data.status === 'published') {
                results[ns] = data.entries;
            }
        }
    }));

    return results;
};
