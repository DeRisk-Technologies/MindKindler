// src/i18n/__tests__/i18n.test.ts

// ... (Existing)

import enGB from '../locales/en-GB';
import frFR from '../locales/fr-FR';

const t = (translations: any, key: string, params?: any): string => {
    const keys = key.split('.');
    let value = translations;
    let fallback = enGB;

    for (const k of keys) {
        value = value?.[k];
        fallback = fallback?.[k as keyof typeof fallback] as any;
    }

    let result = (value as string) || (fallback as unknown as string) || key;

    if (params && typeof result === 'string') {
        Object.entries(params).forEach(([k, v]) => {
            result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
    }
    return result;
};

// Mock resolution logic test
const resolveLocale = (
    userPref: string | null, 
    tenantDefault: string, 
    tenantSupported: string[], 
    allowOverride: boolean
) => {
    if (allowOverride && userPref && tenantSupported.includes(userPref)) {
        return userPref;
    } else if (tenantSupported.includes(tenantDefault)) {
        return tenantDefault;
    }
    return 'en-GB'; // App Default
}

describe('i18n Logic', () => {
    describe('Translation Function', () => {
        test('resolves simple key in default locale', () => {
            expect(t(enGB, 'common.save')).toBe('Save');
        });

        test('resolves simple key in French locale', () => {
            expect(t(frFR, 'common.save')).toBe('Enregistrer');
        });

        test('falls back to default locale if key missing in target', () => {
            // Mock a missing key in French pack
            const incompleteFR = { ...frFR, common: { ...frFR.common, save: undefined } };
            expect(t(incompleteFR, 'common.save')).toBe('Save');
        });

        test('returns key if missing in both', () => {
            expect(t(enGB, 'missing.key.test')).toBe('missing.key.test');
        });

        test('interpolates parameters', () => {
            // Add a mock key with param for test
            const mockPack = { test: { hello: "Hello {name}" } };
            expect(t(mockPack, 'test.hello', { name: 'World' })).toBe('Hello World');
        });
    });

    describe('Locale Resolution', () => {
        test('Uses User Pref when allowed and supported', () => {
            const res = resolveLocale('fr-FR', 'en-GB', ['en-GB', 'fr-FR'], true);
            expect(res).toBe('fr-FR');
        });

        test('Ignores User Pref when override disabled', () => {
            const res = resolveLocale('fr-FR', 'en-GB', ['en-GB', 'fr-FR'], false);
            expect(res).toBe('en-GB');
        });

        test('Ignores User Pref when not supported by tenant', () => {
            const res = resolveLocale('es-ES', 'en-GB', ['en-GB', 'fr-FR'], true);
            expect(res).toBe('en-GB');
        });

        test('Falls back to tenant default if user pref missing', () => {
             const res = resolveLocale(null, 'fr-FR', ['en-GB', 'fr-FR'], true);
             expect(res).toBe('fr-FR');
        });
    });
});
