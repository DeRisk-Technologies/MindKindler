// src/i18n/provider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nContextProps, LocaleCode, SUPPORTED_LOCALES, DEFAULT_LOCALE, Translations, LocaleConfig } from './types';
import enGB from './locales/en-GB';
import frFR from './locales/fr-FR';
import { getTenantLocalizationSettings } from '@/services/localization-service';
import { getAllPublishedOverrides } from '@/services/translation-service';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Base loader
const loadBaseLocaleData = (locale: LocaleCode): Translations => {
  switch (locale) {
    case 'fr-FR': return frFR as unknown as Translations;
    case 'en-GB': default: return enGB as unknown as Translations;
  }
};

// Deep merge helper
const deepMerge = (target: any, source: any) => {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
};

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>(enGB as unknown as Translations);
  const [availableLocales, setAvailableLocales] = useState<LocaleConfig[]>(SUPPORTED_LOCALES);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Apply locale + merge overrides
  const applyLocale = useCallback(async (newLocale: LocaleCode, activeTenantId?: string) => {
      const tid = activeTenantId || tenantId;
      
      // 1. Load Base Pack
      const baseData = loadBaseLocaleData(newLocale);
      
      // 2. Load Overrides if Tenant Known
      if (tid && tid !== 'global') {
          // Known namespaces from base pack
          const namespaces = Object.keys(baseData); 
          try {
              const overrides = await getAllPublishedOverrides(tid, newLocale, namespaces);
              
              // 3. Merge
              // We iterate overrides by namespace and merge into baseData
              Object.entries(overrides).forEach(([ns, entries]) => {
                  if (baseData[ns]) {
                      // shallow merge of keys for that namespace
                      // The entries is flat: { "welcome": "Hola" }
                      // baseData[ns] is object: { welcome: "Welcome", save: "Save" }
                      Object.assign(baseData[ns], entries); 
                  }
              });
          } catch (e) {
              console.warn("Failed to load translation overrides", e);
          }
      }

      setLocaleState(newLocale);
      setTranslations(baseData);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('mindkindler_locale', newLocale);
      }
  }, [tenantId]);

  useEffect(() => {
    let isMounted = true;

    const initLocale = async () => {
        let userPref = typeof window !== 'undefined' ? localStorage.getItem('mindkindler_locale') : null;
        let tenantDefault = DEFAULT_LOCALE;
        let tenantSupported = SUPPORTED_LOCALES.map(l => l.code);
        let allowOverride = true;
        let tid = 'global';

        const user = auth.currentUser;
        if (user) {
             try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                tid = userDoc.data()?.tenantId || 'global';
                setTenantId(tid);
                
                const settings = await getTenantLocalizationSettings(tid);
                tenantDefault = settings.defaultLocale;
                tenantSupported = settings.supportedLocales;
                allowOverride = settings.allowUserLocaleOverride;
             } catch (e) {
                 console.warn("Failed to load tenant locale settings", e);
             }
        }

        if (!isMounted) return;

        const filteredLocales = SUPPORTED_LOCALES.filter(l => tenantSupported.includes(l.code));
        setAvailableLocales(filteredLocales);

        let finalLocale = DEFAULT_LOCALE;
        if (allowOverride && userPref && tenantSupported.includes(userPref)) {
            finalLocale = userPref;
        } else if (tenantSupported.includes(tenantDefault)) {
            finalLocale = tenantDefault;
        }

        await applyLocale(finalLocale, tid);
        setLoading(false);
    };

    const unsub = auth.onAuthStateChanged(() => {
        initLocale();
    });

    return () => {
        isMounted = false;
        unsub();
    }
  }, [applyLocale]);

  const setLocale = useCallback((newLocale: LocaleCode) => {
    if (!availableLocales.find(l => l.code === newLocale)) {
        console.warn(`Locale ${newLocale} not supported by this tenant.`);
        return;
    }
    applyLocale(newLocale);
  }, [availableLocales, applyLocale]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;
    let fallbackValue: any = enGB; 

    for (const k of keys) {
      value = value?.[k];
      fallbackValue = fallbackValue?.[k];
    }

    let result = (value as string) || (fallbackValue as string) || key;

    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return result;
  }, [translations]);

  const currentConfig = availableLocales.find(l => l.code === locale) || SUPPORTED_LOCALES[0];

  return (
    <I18nContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      availableLocales, 
      dir: currentConfig?.dir || 'ltr' 
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
