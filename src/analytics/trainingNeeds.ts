// src/analytics/trainingNeeds.ts

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { VertexAI } from '@google-cloud/vertexai';
import * as levenshtein from 'levenshtein';

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || 'mindkindler-84fcf';
const location = 'europe-west3';
const vertex_ai = new VertexAI({ project: project, location: location });
// UPGRADE: Switched to Gemini 2.0 Flash
const model = vertex_ai.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

interface ReportEdit {
    sectionId: string;
    original: string;
    final: string;
    distance: number;
    ratio: number; // 0.0 to 1.0 (1.0 = completely rewritten)
}

/**
 * Weekly Job: Analyzes report edits to find training needs.
 */
export async function analyzeTrainingNeeds(userId: string, tenantId: string) {
    const db = getFirestore();
    
    // 1. Fetch Last 5 Finalized Reports for this User
    const reportsSnap = await db.collection('reports')
        .where('createdBy', '==', userId)
        .where('status', 'in', ['signed', 'final'])
        .orderBy('updatedAt', 'desc')
        .limit(5)
        .get();

    if (reportsSnap.empty) return;

    const edits: ReportEdit[] = [];

    // 2. Analyze Edits (Compare AI Draft vs Final)
    for (const doc of reportsSnap.docs) {
        const report = doc.data();
        
        // We need the AI provenance to compare. 
        // In a real system, we'd store the 'draftContent' in the report history or link to provenance.
        // Assuming we stored 'aiProvenanceId' in the report:
        if (!report.aiProvenanceId) continue;

        const provSnap = await db.collection('ai_provenance').doc(report.aiProvenanceId).get();
        if (!provSnap.exists) continue;

        const aiOutput = provSnap.data()?.parsedOutput?.sections || [];
        const finalContent = report.content?.sections || [];

        // Compare Section by Section
        aiOutput.forEach((aiSec: any) => {
            const finalSec = finalContent.find((s: any) => s.id === aiSec.id);
            if (finalSec) {
                const dist = new levenshtein(aiSec.content, finalSec.content).distance;
                const len = Math.max(aiSec.content.length, finalSec.content.length);
                const ratio = len > 0 ? dist / len : 0;

                if (ratio > 0.6) { // Threshold: 60% rewritten
                    edits.push({
                        sectionId: aiSec.title, // e.g., "Section B: Needs"
                        original: aiSec.content,
                        final: finalSec.content,
                        distance: dist,
                        ratio
                    });
                }
            }
        });
    }

    // 3. Identify Pattern
    if (edits.length === 0) return;

    // Group by Section Title to find frequent issues
    const issues: Record<string, number> = {};
    edits.forEach(e => {
        issues[e.sectionId] = (issues[e.sectionId] || 0) + 1;
    });

    // Find top issue
    const topIssue = Object.keys(issues).reduce((a, b) => issues[a] > issues[b] ? a : b);
    
    // If it happened > 2 times in 5 reports, trigger training
    if (issues[topIssue] >= 2) {
        console.log(`[GapScanner] User ${userId} struggles with ${topIssue}. Generating training...`);
        await generateMicroCourse(userId, tenantId, topIssue);
    }
}

async function generateMicroCourse(userId: string, tenantId: string, topic: string) {
    const prompt = `
        Role: Senior Educational Psychologist Supervisor.
        Task: Create a 3-part Micro-Training Course for a junior EPP.
        
        Context: The EPP frequently rewrites the AI draft for "${topic}". 
        This suggests they disagree with the standard phrasing or statutory criteria used by the AI.
        
        Goal: Bridge the gap between standard statutory wording and their preferred style, ensuring compliance with the UK SEND Code of Practice.

        Output JSON:
        {
            "title": "Mastering ${topic} for Statutory Advice",
            "description": "A focused refresher on writing high-quality, compliant ${topic} sections.",
            "content": [
                { "title": "Part 1: The Statutory Framework", "textContent": "..." },
                { "title": "Part 2: Common Pitfalls & Phrasing", "textContent": "..." },
                { "title": "Part 3: Best Practice Examples", "textContent": "..." }
            ]
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates?.[0].content.parts[0].text;
        
        if (!text) throw new Error("No AI response");

        const courseData = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));

        // Save to User's Training Queue
        const db = getFirestore();
        await db.collection('trainingModules').add({
            tenantId,
            assignedUserId: userId,
            title: courseData.title,
            description: courseData.description,
            generatedBy: 'ai_gap_scanner',
            rationale: `Frequent rewrites detected in ${topic}.`,
            content: courseData.content.map((c: any, i: number) => ({
                id: `lesson_${i}`,
                type: 'text',
                title: c.title,
                textContent: c.textContent,
                durationMinutes: 5,
                completed: false
            })),
            status: 'pending',
            progressPercent: 0,
            createdAt: new Date().toISOString()
        });

        console.log(`[GapScanner] Training assigned to ${userId}`);

    } catch (e) {
        console.error("[GapScanner] Failed to generate course", e);
    }
}
