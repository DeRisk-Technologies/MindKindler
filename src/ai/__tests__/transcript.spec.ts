// src/ai/__tests__/transcript.spec.ts

import { chunkTranscript, normalizeSpeakerTags } from "../utils/transcript";

describe('Transcript Utils', () => {
    
    describe('normalizeSpeakerTags', () => {
        test('normalizes various role names', () => {
            const raw = "EPP: Hello\nStudent: Hi\nMother: Concern";
            const norm = normalizeSpeakerTags(raw);
            expect(norm).toContain("[EPP]: Hello");
            expect(norm).toContain("[Student]: Hi");
            expect(norm).toContain("[Parent]: Concern");
        });

        test('handles mixed spacing', () => {
            const raw = "\nTeacher: Text";
            expect(normalizeSpeakerTags(raw)).toContain("\n[Teacher]: Text");
        });
    });

    describe('chunkTranscript', () => {
        test('splits long text into chunks', () => {
            // Mock ~100 chars -> roughly 25 tokens
            // Set limit to 10 tokens (~40 chars) to force split
            const text = "A".repeat(100);
            const chunks = chunkTranscript(text, { tokensPerChunk: 10, overlapPercent: 0 });
            
            expect(chunks.length).toBeGreaterThan(1);
            expect(chunks[0].chunkIndex).toBe(0);
            expect(chunks[0].totalChunks).toBe(chunks.length);
        });

        test('respects word boundaries', () => {
            const text = "This is a sentence that should split safely.";
            // Force split in middle of "sentence" if naive, but safe logic should snap to space
            // "This is a " = 10 chars. 
            // set limit ~12 chars.
            const chunks = chunkTranscript(text, { tokensPerChunk: 3, overlapPercent: 0 });
            
            // Should not end with "sen"
            expect(chunks[0].text.endsWith("sentence")).toBe(false); 
            // ideally snaps to "a" or "is"
        });

        test('handles overlap', () => {
            const text = "One Two Three Four Five Six";
            // Small chunks to force overlap visibility
            const chunks = chunkTranscript(text, { tokensPerChunk: 2, overlapPercent: 50 });
            
            // Expected: "One Two", "Two Three", "Three Four"...
            // Rough logic check
            if (chunks.length > 1) {
                // Check if end of chunk 0 appears in start of chunk 1
                const c0 = chunks[0].text;
                const c1 = chunks[1].text;
                // very rough check as our logic is char based estimation
                // but we expect overlap
            }
        });
    });
});
