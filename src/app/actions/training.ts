// src/app/actions/training.ts
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // You might need to ensure this utility exists or use direct admin init
import { revalidatePath } from 'next/cache';
import { ExamResult, Certification } from '@/types/schema';

// Helper to init admin if not already (assuming standard pattern)
// In a server action, we need a robust way to get the current user ID
// Usually passed from client or verified via session cookie if using NextAuth/Firebase Admin SDK
// For this stack, we'll assume we pass the ID token or rely on a helper that gets the session.
// However, since 'use server' actions run in Node, we can verify the ID token if passed, 
// or simply trust the client passes the UID if we are in a protected context (though validating token is better).

// SIMPLIFIED APPROACH for Pilot: We will accept userId as param but in production MUST verify session.
// Ideally: import { verifySession } from '@/lib/auth-admin';

export async function completeTrainingModule(userId: string, moduleId: string, score: number, passed: boolean) {
    if (!userId || !moduleId) throw new Error("Missing parameters");

    try {
        const db = adminDb || getFirestore(); // Fallback
        const now = new Date().toISOString();

        // 1. Update Module Status
        const moduleRef = db.collection('trainingModules').doc(moduleId);
        const moduleSnap = await moduleRef.get();
        
        if (!moduleSnap.exists) throw new Error("Module not found");
        const moduleData = moduleSnap.data();

        // Security Check: Ensure user owns this module
        if (moduleData?.assignedUserId !== userId) {
            throw new Error("Unauthorized: You do not own this training module.");
        }

        await moduleRef.update({
            status: 'completed',
            progressPercent: 100,
            completedAt: now,
            score: score
        });

        // 2. Log Exam Result
        const examResult: ExamResult = {
            id: `exam_${moduleId}_${Date.now()}`,
            moduleId,
            userId,
            score,
            pass: passed,
            attemptDate: now
        };
        await db.collection('exam_results').add(examResult);

        // 3. Issue Certificate (If Passed)
        if (passed) {
            const cert: Certification = {
                id: `cert_${moduleId}`, // Deterministic ID to prevent dupes
                userId,
                tenantId: moduleData?.tenantId || 'default',
                name: `MindKindler Verified: ${moduleData?.title}`,
                issuer: "MindKindler AI Academy",
                status: 'active',
                verifiedAt: now,
                verifiedBy: 'system_ai_proctor',
                proofUrl: `/certificates/${moduleId}.pdf` // Placeholder for PDF gen
            };
            
            // Use set with merge to be safe
            await db.collection('certifications').doc(cert.id).set(cert, { merge: true });
        }

        revalidatePath('/dashboard/training/my-learning');
        return { success: true, certificateIssued: passed };

    } catch (e: any) {
        console.error("Training Completion Error:", e);
        return { success: false, error: e.message };
    }
}
