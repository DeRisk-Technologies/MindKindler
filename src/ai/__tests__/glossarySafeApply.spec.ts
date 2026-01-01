// src/ai/__tests__/glossarySafeApply.spec.ts

import { applyGlossaryToStructured } from "../utils/glossarySafeApply";

describe('Glossary Safe Apply', () => {
    const glossary = { "Student": "Learner", "Teacher": "Educator" };

    test('replaces terms in allowed string fields', () => {
        const input = {
            summary: "The Student met the Teacher.",
            meta: "unchanged"
        };
        const { artifact, replacements } = applyGlossaryToStructured(input, glossary, ['summary']);
        
        expect(artifact.summary).toBe("The Learner met the Educator.");
        expect(artifact.meta).toBe("unchanged");
        expect(replacements).toBeGreaterThan(0);
    });

    test('handles nested arrays and wildcards', () => {
        const input = {
            plan: [
                "The Student needs help.",
                "Teacher intervention."
            ],
            other: ["Student"]
        };
        // Target plan[] specifically
        const { artifact } = applyGlossaryToStructured(input, glossary, ['plan[]']);
        
        expect(artifact.plan[0]).toBe("The Learner needs help.");
        expect(artifact.plan[1]).toBe("Educator intervention.");
        expect(artifact.other[0]).toBe("Student"); // Should not change
    });

    test('does not corrupt structure', () => {
        const input = { key: "Student", val: 123 };
        const { artifact } = applyGlossaryToStructured(input, glossary); // Apply all
        
        expect(artifact.key).toBe("Learner");
        expect(artifact.val).toBe(123);
        expect(Object.keys(artifact)).toEqual(['key', 'val']);
    });

    test('returns original if glossary empty', () => {
        const input = { text: "Student" };
        const { artifact } = applyGlossaryToStructured(input, {}, ['text']);
        expect(artifact.text).toBe("Student");
    });
});
