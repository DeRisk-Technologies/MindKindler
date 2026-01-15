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

    // 5. PHASE 43: COMMERCIAL & INTELLIGENCE INJECTIONS
    console.log("- Seeding Phase 43 Data (Marketplace, Telemetry, Requests)...");

    // 5a. Marketplace Items
    const packRef1 = targetDb.collection("marketplace_items").doc("pack_uk_statutory");
    batch.set(packRef1, {
        id: "pack_uk_statutory",
        title: "UK Statutory Essentials",
        description: "Core compliance templates for EHCP Advice.",
        type: "provision_bank",
        version: "1.0",
        price: 0,
        currency: "GBP",
        regionTags: ["UK"],
        createdAt: new Date().toISOString()
    });

    const packRef2 = targetDb.collection("marketplace_items").doc("pack_sensory_adv");
    batch.set(packRef2, {
        id: "pack_sensory_adv",
        title: "Advanced Sensory Processing",
        description: "Specialized module for Ayres Sensory Integration analysis.",
        type: "training_module",
        version: "1.0",
        price: 49.99,
        currency: "GBP",
        stripePriceId: "price_mock_sensory",
        trialDays: 7,
        regionTags: ["UK", "US"],
        createdAt: new Date().toISOString()
    });

    // 5b. Telemetry Data (Triggers Gap Scanner for Sarah)
    for(let j=0; j<5; j++) {
        const telRef = targetDb.collection("telemetry_report_edits").doc();
        batch.set(telRef, {
            reportId: `report_old_${j}`,
            tenantId,
            userId: "pilot_user_sarah",
            sectionId: "sensory_needs",
            aiVersion: "The student has standard sensory needs.",
            finalVersion: "The student exhibits SIGNIFICANT hyper-sensitivity to auditory stimuli (over 80db) requiring ear defenders.",
            editDistance: 45 + j, // 45-50%
            timestamp: new Date(Date.now() - (j * 86400000)).toISOString() // Past 5 days
        });
    }

    // 5c. External Request (Magic Link Demo)
    const requestId = "demo_request_1";
    const requestToken = "demo_token_123";
    const requestExpiry = new Date(Date.now() + 7 * 86400000).toISOString();

    const contribRef = targetDb.collection("contribution_requests").doc(requestId);
    batch.set(contribRef, {
        id: requestId,
        tenantId,
        studentId: "pilot_charlie_0",
        studentName: "Charlie Complex",
        recipientEmail: "parent@example.com",
        recipientRole: "Parent",
        type: "parent_view",
        token: requestToken,
        expiresAt: requestExpiry,
        status: "sent",
        createdAt: new Date().toISOString(),
        createdBy: "pilot_user_sarah"
    });

    const extRef = targetDb.collection("external_requests").doc(requestId);
    batch.set(extRef, {
        id: requestId,
        tenantId,
        studentId: "pilot_charlie_0",
        caseId: "case_charlie_0",
        recipientEmail: "parent@example.com",
        recipientRole: "Parent",
        type: "parent_view",
        token: requestToken,
        expiresAt: requestExpiry,
        status: "sent",
        auditLog: { sentAt: new Date().toISOString() }
    });

    // 6. SAFEGUARDING SCENARIOS (Phase 44)
    console.log("- Seeding Safeguarding Scenarios...");

    // 6a. Sammy Safeguard (Manual Escalation Test)
    const sammyRef = targetDb.collection("students").doc("pilot_student_sammy");
    batch.set(sammyRef, {
        id: "pilot_student_sammy",
        tenantId,
        isSeed: true,
        identity: {
            firstName: { value: "Sammy", metadata: { verified: true } },
            lastName: { value: "Safeguard", metadata: { verified: true } },
            dateOfBirth: { value: "2012-04-01", metadata: { verified: true } },
            gender: { value: "Male", metadata: {} }
        },
        alerts: [{ type: "high_risk", message: "Self-harm history" }, { type: "medium", message: "Flight risk" }],
        family: {
            parents: [
                {
                    id: "contact_1",
                    tenantId,
                    firstName: "Sarah",
                    lastName: "Smith",
                    relationshipType: "Mother",
                    email: "parent.demo@test.com",
                    phone: "07700 900001",
                    hasParentalResponsibility: true,
                    isEmergencyContact: true,
                    canPickUp: true,
                    languages: ["English"],
                    isPrimaryContact: true,
                    verificationStatus: "verified_id"
                },
                {
                    id: "contact_2",
                    tenantId,
                    firstName: "John",
                    lastName: "Doe",
                    relationshipType: "Other", // SENCO usually not in family array, but using Other for demo convenience
                    email: "senco.demo@school.com",
                    phone: "0161 123 4567",
                    hasParentalResponsibility: false,
                    isEmergencyContact: true,
                    canPickUp: false,
                    languages: ["English"],
                    isPrimaryContact: false,
                    verificationStatus: "verified_id"
                },
                {
                    id: "contact_3",
                    tenantId,
                    firstName: "Social Services",
                    lastName: "(Emergency Duty)",
                    relationshipType: "Other",
                    email: "edt@council.gov.uk",
                    phone: "999",
                    hasParentalResponsibility: false,
                    isEmergencyContact: true,
                    canPickUp: false,
                    languages: ["English"],
                    isPrimaryContact: false,
                    verificationStatus: "verified_id"
                }
            ]
        },
        meta: { createdAt: new Date().toISOString(), trustScore: 100 }
    });

    const sammyCase = targetDb.collection("cases").doc("case_sammy_risk");
    batch.set(sammyCase, {
        id: sammyCase.id, tenantId, type: 'student', subjectId: "pilot_student_sammy",
        title: "Safeguarding Monitoring", status: 'active', priority: 'Critical',
        createdAt: new Date().toISOString()
    });

    // 6b. Riley Risk (AI Detection Drill)
    const rileyRiskRef = targetDb.collection("students").doc("pilot_riley_risk");
    batch.set(rileyRiskRef, {
        id: "pilot_riley_risk",
        tenantId,
        isSeed: true,
        identity: {
            firstName: { value: "Riley", metadata: { verified: true } },
            lastName: { value: "Risk", metadata: { verified: true } },
            dateOfBirth: { value: "2010-06-15", metadata: { verified: true } },
            gender: { value: "Female", metadata: {} }
        },
        family: {
            parents: [
                {
                    id: "contact_r1",
                    tenantId,
                    firstName: "Risk",
                    lastName: "Mother",
                    relationshipType: "Mother",
                    email: "safe-logging-only@mindkindler.test",
                    phone: "07700 900000",
                    hasParentalResponsibility: true,
                    isEmergencyContact: true,
                    canPickUp: true,
                    languages: ["English"],
                    isPrimaryContact: true,
                    verificationStatus: "verified_id"
                }
            ]
        },
        meta: { createdAt: new Date().toISOString(), trustScore: 100 }
    });

    const rileySession = targetDb.collection("consultation_sessions").doc("session_riley_risk");
    batch.set(rileySession, {
        id: rileySession.id, 
        tenantId, 
        studentId: "pilot_riley_risk", 
        date: new Date().toISOString(),
        mode: "person_centered", 
        status: "in_progress", 
        transcript: [
            {
                startTime: 0,
                endTime: 10,
                speaker: "EPP",
                text: "How are things at home, Riley?"
            },
            {
                startTime: 12,
                endTime: 25,
                speaker: "Riley",
                text: "Not good. I feel unsafe at home. Sometimes I think about ending it all during the unstructured play time. I'm scared to go home."
            }
        ], 
        createdAt: new Date().toISOString()
    });

    console.log("- Committing Batch...");
    await batch.commit();
    console.log("✅ Super-Seed Successful. You can now login.");
}

seed().catch(console.error);
