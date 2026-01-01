// src/components/student360/__tests__/Localization.spec.tsx

import enGB from "@/i18n/locales/en-GB";
import frFR from "@/i18n/locales/fr-FR";

describe('Student 360 Localization', () => {
    test('en-GB has all required keys', () => {
        expect(enGB.student360).toBeDefined();
        expect(enGB.student360.riskBanner.title).toBe("Safeguarding Risk Detected");
        expect(enGB.student360.evidence.trust).toBe("Trust");
    });

    test('fr-FR matches en-GB structure', () => {
        const enKeys = Object.keys(enGB.student360);
        const frKeys = Object.keys(frFR.student360);
        expect(frKeys).toEqual(expect.arrayContaining(enKeys));
        
        expect(frFR.student360.riskBanner.title).toBe("Risque de Sauvegarde Détecté");
    });
});
