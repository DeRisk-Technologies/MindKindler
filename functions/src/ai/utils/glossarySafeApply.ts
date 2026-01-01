// src/ai/utils/glossarySafeApply.ts

import { applyGlossaryToText } from "./prompt-builder";

/**
 * Safely applies glossary replacements to structured objects (JSON).
 * Recursively walks the object and applies replacements only to string values
 * in allowed fields, preventing corruption of keys or non-text data.
 * 
 * @param artifact The parsed JSON object (e.g. report, insights list)
 * @param glossary The term mapping { "Student": "Learner" }
 * @param fieldsToApply Optional array of dot-notation paths or simple keys to target. 
 *                      If omitted, applies to ALL string values (use with caution).
 *                      Supports wildcards like 'sections[].content' or 'plan[]'.
 */
export function applyGlossaryToStructured(
    artifact: any, 
    glossary: Record<string, string>, 
    fieldsToApply?: string[]
): { artifact: any; replacements: number } {
    
    if (!glossary || Object.keys(glossary).length === 0) {
        return { artifact, replacements: 0 };
    }

    let count = 0;

    const processValue = (value: any, path: string): any => {
        if (typeof value === 'string') {
            // Check if this path should be processed
            let matches = true; // Default match if no filter
            
            if (fieldsToApply) {
                matches = fieldsToApply.some(pattern => {
                    // Logic fix: 
                    // 'plan[]' pattern implies 'plan' array items.
                    // The path we construct is 'plan.0'.
                    // We need regex to match 'plan' followed by dot and digits.
                    
                    if (pattern.endsWith('[]')) {
                        const baseKey = pattern.slice(0, -2);
                        // Matches 'plan.0', 'plan.1', etc.
                        return new RegExp(`^${baseKey}\\.\\d+$`).test(path) || 
                               new RegExp(`^.*\\.${baseKey}\\.\\d+$`).test(path);
                    }
                    
                    // Support 'sections[].title' pattern (field inside array object)
                    if (pattern.includes('[].')) {
                        const [arrayKey, fieldKey] = pattern.split('[].');
                        // path could be 'sections.0.title'
                        // regex: ^sections\.\d+\.title$
                        const regex = new RegExp(`^${arrayKey}\\.\\d+\\.${fieldKey}$`);
                        return regex.test(path) || (new RegExp(`^.*\\.${arrayKey}\\.\\d+\\.${fieldKey}$`).test(path));
                    }

                    // Direct key match (e.g. 'summary')
                    return path === pattern || path.endsWith(`.${pattern}`);
                });
            }

            if (!matches) return value;

            const original = value;
            const replaced = applyGlossaryToText(value, glossary);
            if (original !== replaced) count++;
            return replaced;
        }

        if (Array.isArray(value)) {
            // When recursing arrays, we append index to path: 'plan.0'
            return value.map((item, index) => processValue(item, `${path ? path + '.' : ''}${index}`));
        }

        if (typeof value === 'object' && value !== null) {
            const next = { ...value };
            Object.keys(next).forEach(key => {
                // When recursing objects, append key: 'sections.0.content'
                // But initially, if path is empty, just 'summary'
                const nextPath = path ? `${path}.${key}` : key;
                next[key] = processValue(next[key], nextPath);
            });
            return next;
        }

        return value;
    };

    const result = processValue(artifact, '');
    
    return { artifact: result, replacements: count };
}
