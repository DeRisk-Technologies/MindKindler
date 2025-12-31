// src/ai/utils/transcript.ts

export interface TranscriptChunk {
    text: string;
    chunkIndex: number;
    totalChunks: number;
    startIndex: number;
    endIndex: number;
}

export interface ChunkingOptions {
    tokensPerChunk?: number;
    overlapPercent?: number;
}

// Rough estimation: 1 token ~= 4 characters for English
const CHARS_PER_TOKEN = 4;

export function chunkTranscript(transcript: string, options: ChunkingOptions = {}): TranscriptChunk[] {
    const { tokensPerChunk = 400, overlapPercent = 20 } = options;
    
    if (!transcript) return [];

    const chunkSize = tokensPerChunk * CHARS_PER_TOKEN;
    const overlapSize = Math.floor(chunkSize * (overlapPercent / 100));
    const stepSize = chunkSize - overlapSize;

    const chunks: TranscriptChunk[] = [];
    let currentIndex = 0;

    // Use total length to determine chunks upfront roughly, but dynamic loop is safer
    // We iterate by character index for simplicity, though word boundary splitting is better.
    // For this stage, we'll do character slicing but try to snap to nearest space to avoid cutting words.

    // Safety: prevent infinite loop if stepSize is <= 0
    if (stepSize <= 0) {
        // Fallback: chunk size must be greater than overlap size
        // If overlap >= chunk size, reduce overlap to 0
        const safeStep = chunkSize;
        const safeOverlap = 0;
        
        while (currentIndex < transcript.length) {
            let endIndex = Math.min(currentIndex + chunkSize, transcript.length);
            const chunkText = transcript.slice(currentIndex, endIndex).trim();
            if (chunkText.length > 0) {
                chunks.push({
                    text: chunkText,
                    chunkIndex: chunks.length,
                    totalChunks: 0,
                    startIndex: currentIndex,
                    endIndex: endIndex
                });
            }
            if (endIndex === transcript.length) break;
            currentIndex = endIndex;
        }
        return chunks.map(c => ({ ...c, totalChunks: chunks.length }));
    }

    while (currentIndex < transcript.length) {
        let endIndex = currentIndex + chunkSize;
        
        // Ensure we don't go past the end
        if (endIndex > transcript.length) {
            endIndex = transcript.length;
        } else {
            // Snap to last space within the limit to avoid cutting words
            // Only search back a reasonable amount (e.g. 50 chars) to prevent eating too much of the chunk
            const lookbackLimit = Math.max(currentIndex, endIndex - 50);
            const lastSpace = transcript.lastIndexOf(' ', endIndex);
            if (lastSpace > lookbackLimit) {
                endIndex = lastSpace;
            }
        }

        const chunkText = transcript.slice(currentIndex, endIndex).trim();
        
        if (chunkText.length > 0) {
            chunks.push({
                text: chunkText,
                chunkIndex: chunks.length,
                totalChunks: 0, // Will update after loop
                startIndex: currentIndex,
                endIndex: endIndex
            });
        }

        // Advance
        if (endIndex === transcript.length) break;
        currentIndex = endIndex - overlapSize;
        
        // Safety break if step is 0 or negative
        if (stepSize <= 0) break; 
    }

    // Update total count
    return chunks.map(c => ({ ...c, totalChunks: chunks.length }));
}

export function normalizeSpeakerTags(transcript: string): string {
    if (!transcript) return "";
    
    // Normalize various formats to standard [Role:]
    // E.g. "Speaker 1:" -> "[Speaker 1:]"
    // "EPP:" -> "[EPP:]"
    
    // 1. Ensure brackets around standardized roles
    // Regex looks for "Role:" at start of lines or after newlines
    
    return transcript
        .replace(/(^|\n)(EPP|Psychologist|Doctor|Clinician):/gi, '$1[EPP]:')
        .replace(/(^|\n)(Student|Child|Client|Patient):/gi, '$1[Student]:')
        .replace(/(^|\n)(Parent|Mother|Father|Guardian):/gi, '$1[Parent]:')
        .replace(/(^|\n)(Teacher|Educator):/gi, '$1[Teacher]:');
}
