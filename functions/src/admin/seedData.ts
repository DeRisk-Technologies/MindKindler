import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { faker } from '@faker-js/faker';

// Lazy init for AI to prevent cold-start crashes if env vars missing
let ai: any = null;

const getAi = () => {
    if (!ai) {
        try {
            // Check for API Key presence explicitly
            if (!process.env.GOOGLE_GENAI_API_KEY) {
                console.warn("GOOGLE_GENAI_API_KEY is missing. AI features will fail.");
                throw new Error("Missing API Key");
            }
            ai = genkit({
                plugins: [googleAI()],
                model: "googleai/gemini-1.5-flash", 
            });
        } catch (e) {
            console.error("Failed to init Genkit", e);
            throw new Error("AI Service Unavailable");
        }
    }
    return ai;
};

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const seedDemoDataHandler = async (request: CallableRequest) => {
    const db = getDb();
    const batch = db.batch();
    const studentIds: string[] = [];

    const count = 5;
    
    // Prompt Gemini for rich profiles
    const profilePrompt = `Generate ${count} diverse student profiles for an elementary school.
    Include:
    1. 'riskLevel': 'Low', 'Medium', 'High'
    2. 'diagnosis': Array of strings (e.g. "ADHD", "None", "Dyslexia")
    3. 'narrative': A 2-sentence summary of their current educational status.
    4. 'recentEvents': Array of 3 recent events (e.g. "Failed math test", "Fight in playground").
    
    Return pure JSON array.`;

    let aiProfiles: any[] = [];
    try {
        const aiInstance = getAi();
        const { output } = await aiInstance.generate(profilePrompt);
        const text = output?.text || "[]";
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        aiProfiles = JSON.parse(jsonStr);
    } catch (e) {
        console.warn("AI Gen Failed, using fallback. Key likely missing or error.", e);
        // Fallback profiles if AI fails
        aiProfiles = Array(count).fill({ riskLevel: 'Low', diagnosis: [], narrative: "Standard student (Fallback).", recentEvents: [] });
    }

    // 3. Create Entities
    for (const profile of aiProfiles) {
        const studentRef = db.collection("students").doc();
        const studentId = studentRef.id;
        studentIds.push(studentId);

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        // Student Doc
        batch.set(studentRef, {
            firstName,
            lastName,
            dateOfBirth: faker.date.birthdate({ min: 6, max: 12, mode: 'age' }).toISOString().split('T')[0],
            gender: faker.person.sexType(),
            schoolId: "sch_demo_1",
            districtId: "dst_demo_1",
            socioEconomicStatus: faker.helpers.arrayElement(['low', 'medium', 'high']),
            diagnosisCategory: profile.diagnosis,
            riskLevel: profile.riskLevel, // Custom field for analytics
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Assessment Results (Historical Trend)
        for (let m = 0; m < 6; m++) {
            const date = new Date();
            date.setMonth(date.getMonth() - m);
            
            let baseScore = profile.riskLevel === 'High' ? 60 : (profile.riskLevel === 'Medium' ? 75 : 90);
            let variance = faker.number.int({ min: -10, max: 10 });
            
            batch.set(db.collection("assessment_results").doc(), {
                studentId,
                templateId: "tpl_math_fluency",
                totalScore: Math.min(100, Math.max(0, baseScore + variance)),
                maxScore: 100,
                status: 'graded',
                completedAt: date.toISOString(),
                subject: 'Math' 
            });
        }

        // Attendance / Behavior Logs 
        for (const event of profile.recentEvents) {
            batch.set(db.collection("attendance_logs").doc(), {
                studentId,
                date: faker.date.recent({ days: 60 }).toISOString(),
                type: event.toLowerCase().includes('absent') ? 'absence' : 'incident',
                description: event,
                severity: profile.riskLevel === 'High' ? 'high' : 'low'
            });
        }

        // Case File
        if (profile.riskLevel !== 'Low') {
            const caseRef = db.collection("cases").doc();
            batch.set(caseRef, {
                title: `${firstName}'s Intervention Plan`,
                type: 'student',
                studentId,
                status: 'In Progress',
                priority: profile.riskLevel,
                description: profile.narrative,
                openedAt: new Date().toISOString(),
                activities: [
                    {
                        id: "act_1",
                        type: "note",
                        summary: "Initial referral triggered by AI Analysis.",
                        date: new Date().toISOString(),
                        performedBy: "System AI"
                    }
                ]
            });
        }
    }

    // 4. Create a Demo School
    batch.set(db.collection("schools").doc("sch_demo_1"), {
        name: "MindKindler Academy",
        district: "District Alpha",
        level: "Primary",
        address: faker.location.streetAddress(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return { success: true, message: `Seeded ${count} students and related records.` };
};
