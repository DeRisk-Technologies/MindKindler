// src/services/localization-service.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { TenantLocalizationSettings } from "@/types/schema";

const DEFAULT_SETTINGS: TenantLocalizationSettings = {
  defaultLocale: 'en-GB',
  supportedLocales: ['en-GB', 'fr-FR', 'es-ES'],
  allowUserLocaleOverride: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export const getTenantLocalizationSettings = async (tenantId: string): Promise<TenantLocalizationSettings> => {
  if (!tenantId || tenantId === 'global') return DEFAULT_SETTINGS;

  try {
    const docRef = doc(db, "tenants", tenantId, "settings", "localization");
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data() as TenantLocalizationSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error fetching tenant localization settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const updateTenantLocalizationSettings = async (
  tenantId: string, 
  settings: Partial<TenantLocalizationSettings>,
  userId: string
) => {
  const docRef = doc(db, "tenants", tenantId, "settings", "localization");
  await setDoc(docRef, {
    ...settings,
    updatedAt: new Date().toISOString(), // Use ISO string to match interface, though serverTimestamp is better in FS
    updatedBy: userId
  }, { merge: true });
};
