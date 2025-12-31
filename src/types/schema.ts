// src/types/schema.ts

// ... (Previous Content)

export interface TenantLocalizationSettings {
  defaultLocale: string;
  supportedLocales: string[];
  allowUserLocaleOverride: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface TenantSettings {
  localization?: TenantLocalizationSettings;
}

export interface TranslationOverrideDoc {
  id?: string; // namespace (e.g. 'common')
  locale: string; // e.g. 'fr-FR'
  namespace: string;
  entries: Record<string, string>;
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface GlossaryDoc {
  id?: string; // locale (e.g. 'en-GB')
  locale: string;
  entries: Record<string, string>; // canonical -> preferred
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
  publishedBy?: string;
}
