// src/scripts/seed-pilot.ts
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { faker } from '@faker-js/faker';

// Use service account for production access if running from terminal
// In this environment, it should use Application Default Credentials
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "mindkindler-84fcf"
    });
}

const db = admin.firestore();

async function seed() {
    console.log("🚀 Starting Production Super-Seed for UK Pilot...");
    
    const region = 'uk';
    const tenantId = 'default';
    const shardId = `mindkindler-${region}`;
    const targetDb = getFirestore(admin.app(), shardId);

    // 1. STAFF
    const staff = [
        { 
            email: "sarah.super@pilot.com", 
            name: "Dr. Sarah Super", 
            role: "EPP", 
            uid: "pilot_user_sarah",
            password: "PilotUK2026!"
        },
        { 
            email: "bella.beginner@pilot.com", 
            name: "Bella Beginner", 
            role: "Trainee", 
            uid: "pilot_user_bella",
            password: "PilotUK2026!" 
        }
    ];

    for (const member of staff) {
        try {
            console.log(`- Seeding Staff: ${member.email}`);
            await admin.auth().getUser(member.uid).catch(async () => {
                return await admin.auth().createUser({
                    uid: member.uid,
                    email: member.email,
                    password: member.password,
                    displayName: member.name
                });
            });
            
            await admin.auth().setCustomUserClaims(member.uid, { 
                role: member.role, 
                region, 
                tenantId 
            });

            await db.doc(`user_routing/${member.uid}`).set({
                uid: member.uid,
                region,
                shardId,
                role: member.role,
                tenantId
            }, { merge: true });

            await targetDb.doc(`users/${member.uid}`).set({
                id: member.uid,
                firstName: member.name.split(' ')[0],
                lastName: member.name.split(' ')[1],
                role: member.role,
                tenantId,
                isSeed: true
            }, { merge: true });
        } catch (e) {
            console.error(`  Failed staff: ${member.email}`, e);
        }
    }

    const batch = targetDb.batch();

    // 2. CHARLIE COMPLEX
    console.log("- Seeding Charlie Complex scenario...");
    for (let i = 0; i < 2; i++) {
        const id = `pilot_charlie_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        batch.set(studentRef, {
            id, tenantId, isSeed: true,
            identity: {
                firstName: { value: "Charlie", metadata: { verified: true } },
                lastName: { value: `Complex ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2015-05-12", metadata: { verified: true } },
                gender: { value: "Male", metadata: {} }
            },
            education: {
                currentSchoolId: { value: "Pilot Primary", metadata: {} },
                senStatus: { value: "E", metadata: {} }, 
                yearGroup: { value: "Year 4", metadata: {} }
            },
            extensions: { uk_upn: `H${faker.number.int({ min: 100000000000, max: 999999999999 })}` },
            health: { conditions: { value: ["Dyslexia", "Anxiety"], metadata: { verified: true } }, allergies: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            family: { parents: [] },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        const caseRef = targetDb.collection("cases").doc(`case_charlie_${i}`);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (18 * 7)); 
        batch.set(caseRef, {
            id: caseRef.id, tenantId, type: 'student', subjectId: id,
            title: "Statutory Assessment (Breach Risk)",
            status: 'active', stage: 'drafting', priority: 'Critical',
            createdAt: startDate.toISOString()
        });

        const psychRef = targetDb.collection("assessment_results").doc(`wisc_charlie_${i}`);
        batch.set(psychRef, {
            id: psychRef.id, studentId: id, templateId: "WISC-V", totalScore: 72,
            responses: { "Verbal Comprehension (VCI)": 95, "Working Memory (WMI)": 72, "Processing Speed (PSI)": 88 },
            completedAt: new Date().toISOString(), status: "graded"
        });
    }

    // 3. SAMMY SIMPLE
    console.log("- Seeding Sammy Simple scenario...");
    for (let i = 0; i < 2; i++) {
        const id = `pilot_sammy_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        batch.set(studentRef, {
            id, tenantId, isSeed: true,
            identity: {
                firstName: { value: "Sammy", metadata: { verified: true } },
                lastName: { value: `Simple ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2018-09-01", metadata: { verified: true } },
                gender: { value: "Female", metadata: {} }
            },
            education: { currentSchoolId: { value: "Pilot Primary", metadata: {} }, senStatus: { value: "K", metadata: {} }, yearGroup: { value: "Year 1", metadata: {} } },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        const consultRef = targetDb.collection("consultation_sessions").doc(`session_sammy_${i}`);
        batch.set(consultRef, {
            id: consultRef.id, tenantId, studentId: id, date: new Date().toISOString(),
            mode: "person_centered", status: "in_progress", transcript: [], createdAt: new Date().toISOString()
        });
    }

    // 4. RILEY REVIEW
    console.log("- Seeding Riley Review scenario...");
    for (let i = 0; i < 2; i++) {
        const id = `pilot_review_${i}`;
        const studentRef = targetDb.collection("students").doc(id);
        batch.set(studentRef, {
            id, tenantId, isSeed: true,
            identity: {
                firstName: { value: "Riley", metadata: { verified: true } },
                lastName: { value: `Review ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2010-03-15", metadata: { verified: true } },
                gender: { value: "Non-binary", metadata: {} }
            },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        const reportRef = targetDb.collection("reports").doc(`report_review_${i}`);
        batch.set(reportRef, {
            id: reportRef.id, tenantId, studentId: id, title: "Appendix K (Draft) - For Approval",
            status: "pending_review", supervisorId: "pilot_user_sarah", createdBy: "pilot_user_bella",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            type: "statutory", content: { sections: [{ id: "s1", title: "Section A", content: "Draft content needs checking." }] }
        });
    }

    console.log("- Committing Batch...");
    await batch.commit();
    console.log("✅ Super-Seed Successful. You can now login.");
}

seed().catch(console.error);
