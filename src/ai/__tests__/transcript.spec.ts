// src/ai/__tests__/transcript.spec.ts

import { chunkTranscript, normalizeSpeakerTags } from "../utils/transcript";

// Mock nothing - this is a pure logic test file.
// We DO NOT import the heavy 'ai/genkit' stuff here.
// This test should be extremely fast and light.

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
            const text = "A".repeat(100);
            const chunks = chunkTranscript(text, { tokensPerChunk: 10, overlapPercent: 0 });
            
            expect(chunks.length).toBeGreaterThan(1);
            expect(chunks[0].chunkIndex).toBe(0);
        });

        test('respects word boundaries', () => {
            const text = "This is a sentence that should split safely.";
            const chunks = chunkTranscript(text, { tokensPerChunk: 3, overlapPercent: 0 });
            expect(chunks[0].text.endsWith("sentence")).toBe(false); 
        });

        test('handles overlap', () => {
            const text = "One Two Three Four Five Six";
            const chunks = chunkTranscript(text, { tokensPerChunk: 2, overlapPercent: 50 });
            if (chunks.length > 1) {
                const zeroOverlapChunks = chunkTranscript(text, { tokensPerChunk: 2, overlapPercent: 0 });
                expect(chunks.length).toBeGreaterThanOrEqual(zeroOverlapChunks.length);
            }
        });
    });
});
