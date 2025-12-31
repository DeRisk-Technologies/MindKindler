// src/ai/__tests__/prompt-builder.test.ts

import { applyGlossaryToText, buildSystemPrompt } from "../utils/prompt-builder";

describe('AI Prompt Utilities', () => {
    
    describe('applyGlossaryToText', () => {
        test('replaces simple terms case-insensitively', () => {
            const glossary = { "Student": "Learner", "Teacher": "Educator" };
            const text = "The Student met with the teacher.";
            const result = applyGlossaryToText(text, glossary);
            expect(result).toBe("The Learner met with the Educator.");
        });

        test('respects word boundaries', () => {
            const glossary = { "cat": "feline" };
            const text = "The cat scattered the category.";
            const result = applyGlossaryToText(text, glossary);
            expect(result).toBe("The feline scattered the category.");
        });

        test('handles multi-word terms (longest first logic)', () => {
            const glossary = { "School Board": "Trustees", "School": "Academy" };
            const text = "The School Board visited the School.";
            // Should match "School Board" first if sorted correctly by logic
            const result = applyGlossaryToText(text, glossary);
            expect(result).toBe("The Trustees visited the Academy.");
        });

        test('escapes special characters safely', () => {
             const glossary = { "C++": "Cpp" };
             const text = "I love C++.";
             const result = applyGlossaryToText(text, glossary);
             expect(result).toBe("I love Cpp.");
        });
    });

    describe('buildSystemPrompt', () => {
        test('includes language instruction', () => {
            const prompt = buildSystemPrompt("Analyze this.", { locale: 'fr-FR', languageLabel: "French" });
            expect(prompt).toContain("Respond strictly in French (fr-FR)");
        });

        test('includes glossary mapping', () => {
             const glossary = { "Pupil": "Student" };
             const prompt = buildSystemPrompt("Analyze this.", { locale: 'en-GB', languageLabel: "English", glossary });
             expect(prompt).toContain('- "Pupil" → "Student"');
        });
    });

});
