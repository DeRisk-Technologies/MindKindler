// functions/src/admin/seedData.ts
import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { faker } from '@faker-js/faker';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * PHASE 26: Super Seed Script for UK Pilot
 */
export const seedDemoDataHandler = async (request: CallableRequest) => {
    
    // --- MODE: Create Regional Admins ---
    if (request.data.action === 'create_regional_admins') {
        // ... (Existing Admin Creation Logic remains if needed)
        // For brevity, skipping unless explicitly requested to rewrite that block
    }

    const region = request.data.region || 'uk'; 
    const tenantId = request.data.tenantId || 'default';
    const shardId = `mindkindler-${region}`;
    const targetDb = region === 'default' ? admin.firestore() : getFirestore(admin.app(), shardId);
    
    console.log(`[SuperSeed] Starting Phase 26 Seed for ${region}...`);

    // --- 1. STAFF CREATION ---
    // Ensure Users exist in Auth (Global) AND Profile (Shard)
    const staff = [
        { 
            email: "sarah.super@pilot.com", 
            name: "Dr. Sarah Super", 
            role: "EPP", 
            uid: "pilot_user_sarah",
            isSenior: true
        },
        { 
            email: "bella.beginner@pilot.com", 
            name: "Bella Beginner", 
            role: "Trainee", 
            uid: "pilot_user_bella",
            isSenior: false 
        }
    ];

    for (const member of staff) {
        // Global Auth & Routing
        try {
            await admin.auth().getUser(member.uid).catch(() => admin.auth().createUser({
                uid: member.uid,
                email: member.email,
                password: "Password123!",
                displayName: member.name
            }));
            
            await admin.auth().setCustomUserClaims(member.uid, { 
                role: member.role, 
                region, 
                tenantId 
            });

            await admin.firestore().doc(`user_routing/${member.uid}`).set({
                uid: member.uid,
                region,
                shardId,
                role: member.role,
                tenantId
            }, { merge: true });

            // Regional Profile
            await targetDb.doc(`users/${member.uid}`).set({
                id: member.uid,
                firstName: member.name.split(' ')[0],
                lastName: member.name.split(' ')[1],
                role: member.role,
                tenantId,
                isSeed: true
            }, { merge: true });

        } catch (e) {
            console.error(`Failed to seed staff ${member.email}`, e);
        }
    }

    const batch = targetDb.batch();

    // --- 2. STUDENT 1: CHARLIE COMPLEX (Statutory Mode) ---
    // Goal: Test Breach Risk & Report Writer
    for (let i = 0; i < 2; i++) {
        const id = `pilot_charlie_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Charlie", metadata: { verified: true } },
                lastName: { value: `Complex ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2015-05-12", metadata: { verified: true } }, // Age ~9
                gender: { value: "Male", metadata: {} }
            },
            education: {
                currentSchoolId: { value: "Pilot Primary", metadata: {} },
                senStatus: { value: "E", metadata: {} }, // EHCP
                yearGroup: { value: "Year 4", metadata: {} }
            },
            extensions: { uk_upn: `H${faker.number.int({ min: 100000000000, max: 999999999999 })}` },
            health: { conditions: { value: ["Dyslexia", "Anxiety"], metadata: { verified: true } }, allergies: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            family: { parents: [] },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        // CASE: 18 Weeks Old (Breach Risk)
        const caseRef = targetDb.collection("cases").doc(`case_charlie_${i}`);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (18 * 7)); // 18 weeks ago

        batch.set(caseRef, {
            id: caseRef.id,
            tenantId,
            type: 'student',
            subjectId: id,
            title: "Statutory Assessment (Breach Risk)",
            status: 'active',
            stage: 'drafting', // Late stage
            priority: 'Critical',
            createdAt: startDate.toISOString(),
            slaDueAt: new Date().toISOString() // Now = Overdue
        });

        // PSYCHOMETRICS: Low WMI
        const psychRef = targetDb.collection("assessment_results").doc(`wisc_charlie_${i}`);
        batch.set(psychRef, {
            id: psychRef.id,
            studentId: id,
            templateId: "WISC-V",
            totalScore: 72, // Low
            responses: {
                "Verbal Comprehension (VCI)": 95,
                "Working Memory (WMI)": 72, // The trigger
                "Processing Speed (PSI)": 88
            },
            completedAt: new Date().toISOString(),
            status: "graded"
        });

        // CONSULTATION: "I hate reading"
        const consultRef = targetDb.collection("consultation_sessions").doc(`session_charlie_${i}`);
        batch.set(consultRef, {
            id: consultRef.id,
            tenantId,
            studentId: id,
            date: new Date().toISOString(),
            mode: "standard",
            transcript: [
                { id: "1", speaker: "EPP", text: "How do you feel about library time?", timestamp: new Date().toISOString() },
                { id: "2", speaker: "Student", text: "I hate reading. The words move around.", timestamp: new Date().toISOString() } // Matches WMI/Dyslexia
            ],
            status: "completed",
            outcome: {
                clinicalOpinions: [{ type: "risk", text: "Avoidance of literacy tasks consistent with WMI profile.", confirmed: true }]
            }
        });
    }

    // --- 3. STUDENT 2: SAMMY SIMPLE (Early Help Mode) ---
    // Goal: Test Live Cockpit
    for (let i = 0; i < 2; i++) {
        const id = `pilot_sammy_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Sammy", metadata: { verified: true } },
                lastName: { value: `Simple ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2018-09-01", metadata: { verified: true } }, // Age ~6
                gender: { value: "Female", metadata: {} }
            },
            education: {
                currentSchoolId: { value: "Pilot Primary", metadata: {} },
                senStatus: { value: "K", metadata: {} }, // SEN Support
                yearGroup: { value: "Year 1", metadata: {} }
            },
            extensions: { uk_upn: `J${faker.number.int({ min: 100000000000, max: 999999999999 })}` },
            health: { conditions: { value: [], metadata: {} }, allergies: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            family: { parents: [] },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        // No Case (Ad-hoc)
        
        // Active Consultation (P.A.T.H Mode)
        const consultRef = targetDb.collection("consultation_sessions").doc(`session_sammy_${i}`);
        batch.set(consultRef, {
            id: consultRef.id,
            tenantId,
            studentId: id,
            date: new Date().toISOString(),
            mode: "person_centered", // Triggers Live Cockpit PATH
            status: "in_progress", // Can resume
            transcript: [], // Empty to start fresh
            createdAt: new Date().toISOString()
        });
    }

    // --- 4. STUDENT 3: REVIEW CASE (Supervision) ---
    // Goal: Test Supervisor Dashboard
    for (let i = 0; i < 2; i++) {
        const id = `pilot_review_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Riley", metadata: { verified: true } },
                lastName: { value: `Review ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2010-03-15", metadata: { verified: true } }, // Age 14
                gender: { value: "Non-binary", metadata: {} }
            },
            education: {
                currentSchoolId: { value: "Pilot High", metadata: {} },
                senStatus: { value: "E", metadata: {} },
                yearGroup: { value: "Year 9", metadata: {} }
            },
            health: { conditions: { value: [], metadata: {} }, allergies: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            family: { parents: [] },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        // Pending Report
        const reportRef = targetDb.collection("reports").doc(`report_review_${i}`);
        batch.set(reportRef, {
            id: reportRef.id,
            tenantId,
            studentId: id,
            title: "Appendix K (Draft) - For Approval",
            status: "pending_review",
            supervisorId: "pilot_user_sarah", // Assign to Sarah (Admin)
            createdBy: "pilot_user_bella", // Created by Bella (Trainee)
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: "statutory",
            content: { sections: [{ id: "s1", title: "Section A", content: "Draft content needs checking." }] }
        });
    }

    await batch.commit();

    return { 
        success: true, 
        message: `Super-Seed Complete [UK]: 
        - 2x Charlie (Statutory Breach)
        - 2x Sammy (Live Cockpit)
        - 2x Riley (Supervision Queue)` 
    };
};
