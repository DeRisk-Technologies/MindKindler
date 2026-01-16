import * as admin from 'firebase-admin';
import { CaseFile } from '../types/case';
import { Finding, ProvisionSpec } from '../types/report';
import { subWeeks, formatISO, addDays } from 'date-fns';

// --- Configuration ---
// Check if app is already initialized (e.g. if imported elsewhere)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'mindkindler-84fcf'
    });
}

const db = admin.firestore();

/**
 * Helper to calculate dynamic dates relative to today.
 */
const weeksAgo = (weeks: number) => formatISO(subWeeks(new Date(), weeks));

/**
 * Seeding Script for the "Yorkshire Pilot" Scenario.
 */
async function seedPilotData() {
    console.log("🌱 Starting Pilot Data Seed...");

    // 1. CLEAN SLATE
    // Warning: Deletes existing data in these collections
    console.log("🧹 Clearing collections...");
    // Note: In production, batch delete carefully. Here we assume test DB.
    // implementation skipped for safety, assuming empty or overwrite.

    const BATCH = db.batch();
    const TENANT_ID = 'pilot-tenant';
    const REGION = 'uk-north';

    // --- CASE A: XX Jeffery (The Drafting Demo) ---
    console.log("📝 Seeding Case A: XX Jeffery (Drafting Stage)...");
    
    const caseA_Id = 'case-a-jeffery';
    const caseA: CaseFile = {
        id: caseA_Id,
        tenantId: TENANT_ID,
        studentId: 'stu-jeffery-01',
        studentName: 'XX Jeffery',
        dob: '2014-05-12',
        upn: 'Z12345678',
        localAuthorityId: 'York City Council',
        region: REGION,
        status: 'drafting',
        flags: {
            isNonVerbal: false,
            requiresGuardianPresence: false,
            hasSocialWorker: false,
            safeguardingRisk: false
        },
        stakeholders: [
            { id: 'sh-mum', role: 'parent', name: 'MXX Jeffery', contactInfo: { email: 'mum@test.com' }, consentStatus: 'granted', contributionStatus: 'received' },
            { id: 'sh-senco', role: 'senco', name: 'Mrs. Teacher', contactInfo: { email: 'senco@clifton.sch.uk' }, consentStatus: 'granted', contributionStatus: 'received' }
        ],
        statutoryTimeline: {
            requestDate: weeksAgo(14), // 14 weeks ago = Drafting Stage
            decisionToAssessDeadline: weeksAgo(8), // Passed
            evidenceDeadline: weeksAgo(2), // Passed
            draftPlanDeadline: weeksAgo(-2), // 2 weeks in future
            finalPlanDeadline: weeksAgo(-6), // 6 weeks in future
            isOverdue: false
        },
        createdAt: weeksAgo(14),
        updatedAt: new Date().toISOString(),
        createdBy: 'system-seed'
    };

    const caseARef = db.collection('cases').doc(caseA_Id);
    BATCH.set(caseARef, caseA);

    // Inject Findings for Case A (Populating the Report Editor)
    const findingsA: Finding[] = [
        {
            id: 'f-cog-1',
            sourceId: 'Parent Advice (MXX)',
            category: 'cognition_learning',
            text: 'XX loves reading because it takes him to a different dimension. He has hyperlexic traits.',
            isContested: false,
            confidence: 0.95,
            topics: ['reading', 'interests']
        },
        {
            id: 'f-sens-1',
            sourceId: 'Parent Advice (MXX)',
            category: 'sensory_physical',
            text: 'XX wears three sets of underwear (Deep Pressure Seeking) and struggles with the feeling of clothes seams.',
            isContested: false,
            confidence: 0.98,
            topics: ['sensory', 'clothing']
        },
        {
            id: 'f-semh-1',
            sourceId: 'School Report',
            category: 'semh',
            text: 'XX is in danger of developing EBSA (Emotionally Based School Avoidance). Attendance has dropped to 82%.',
            isContested: false, // Could be true
            confidence: 0.9,
            topics: ['attendance', 'anxiety']
        }
    ];

    // We store findings in a subcollection or separate 'drafts' collection
    const draftARef = db.collection('drafts').doc(`draft-${caseA_Id}`);
    BATCH.set(draftARef, {
        id: `draft-${caseA_Id}`,
        caseId: caseA_Id,
        findings: findingsA,
        narrativeSections: { background_history: "XX lives with his mother..." },
        provisionPlan: [], // Empty for user to fill
        createdAt: new Date().toISOString()
    });


    // --- CASE B: Alex Jeffery (The Guardian Trigger - Sibling) ---
    console.log("🚨 Seeding Case B: Alex Jeffery (Sibling Risk)...");
    
    const caseB_Id = 'case-b-jeffery';
    const caseB: any = { // Using any to bypass optional prop strictness for scannable fields
        id: caseB_Id,
        tenantId: TENANT_ID,
        studentName: 'Alex Jeffery',
        schoolId: 'Clifton Green Primary', // Same school
        status: 'assessment',
        flags: {
            safeguardingRisk: true, // TRIGGER
            hasSocialWorker: true
        },
        statutoryTimeline: { requestDate: weeksAgo(4) }, // Early stage
        siblingCaseIds: [caseA_Id] // Link to XX
    };
    
    // Update Case A to link back (Double Link)
    // BATCH.update(caseARef, { siblingCaseIds: [caseB_Id] }); // Hypothetical
    
    BATCH.set(db.collection('cases').doc(caseB_Id), caseB);


    // --- CASE C: Sarah Smith (The Breach Demo) ---
    console.log("⏰ Seeding Case C: Sarah Smith (Breach Risk)...");

    const caseC_Id = 'case-c-smith';
    const caseC: CaseFile = {
        id: caseC_Id,
        tenantId: TENANT_ID,
        studentId: 'stu-smith-01',
        studentName: 'Sarah Smith',
        dob: '2015-01-01',
        localAuthorityId: 'York City Council',
        region: REGION,
        status: 'assessment', // Stuck in assessment
        flags: { isNonVerbal: false, requiresGuardianPresence: false, hasSocialWorker: false, safeguardingRisk: false },
        stakeholders: [],
        statutoryTimeline: {
            requestDate: weeksAgo(22), // 22 WEEKS AGO = BREACH (Target is 20)
            decisionToAssessDeadline: weeksAgo(16),
            evidenceDeadline: weeksAgo(10),
            draftPlanDeadline: weeksAgo(6),
            finalPlanDeadline: weeksAgo(2), // Deadline passed 2 weeks ago
            isOverdue: true
        },
        createdAt: weeksAgo(22),
        updatedAt: new Date().toISOString(),
        createdBy: 'system-seed'
    };
    BATCH.set(db.collection('cases').doc(caseC_Id), caseC);


    // --- CASE D, E, F: Community Cluster (School Risk) ---
    console.log("🏫 Seeding School Cluster: York High...");

    const schoolId = 'York High';
    const clusterCases = [1, 2, 3].map(i => ({
        id: `case-cluster-${i}`,
        tenantId: TENANT_ID,
        studentName: `Student ${i} York`,
        schoolId: schoolId,
        clinicalTags: ['self_harm', 'anxiety'], // TRIGGER
        status: 'assessment',
        statutoryTimeline: { requestDate: weeksAgo(5) },
        updatedAt: new Date().toISOString() // Recent
    }));

    clusterCases.forEach(c => {
        BATCH.set(db.collection('cases').doc(c.id), c);
    });

    // --- PHASE 57 SEEDING: CHAT CHANNELS ---
    console.log("💬 Seeding Chat Channels...");
    const channelId = `chat-case-${caseA_Id}`;
    BATCH.set(db.collection('chat_channels').doc(channelId), {
        id: channelId,
        tenantId: TENANT_ID,
        type: 'case_room',
        caseId: caseA_Id,
        displayName: 'Case Room: XX Jeffery',
        participantIds: ['user-1'], // Assume current user
        participants: { 
            'user-1': { displayName: 'Dr. EP', role: 'epp_lead' } 
        },
        lastMessage: {
            content: "Consultation booked for Tuesday.",
            senderId: 'user-1',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRedacted: false
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // --- PHASE 1 SEEDING: APPOINTMENTS ---
    console.log("📅 Seeding Appointments...");
    const apptId = 'appt-1';
    BATCH.set(db.collection('appointments').doc(apptId), {
        id: apptId,
        tenantId: TENANT_ID,
        title: 'Review: XX Jeffery',
        startAt: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T10:00:00'), // Tomorrow 10am
        endAt: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T11:00:00'),
        type: 'consultation',
        provider: 'zoom',
        status: 'scheduled',
        caseId: caseA_Id
    });

    // --- POLICY RULES (For Guardian) ---
    console.log("📜 Seeding Policy Rules...");
    const ruleId = 'rule-uk-001';
    BATCH.set(db.collection('policyRules').doc(ruleId), {
        id: ruleId,
        tenantId: TENANT_ID,
        title: 'Statutory 20 Week Limit',
        jurisdiction: 'UK',
        triggerEvent: 'timeline_breach',
        triggerCondition: 'weeks > 20',
        mode: 'enforce',
        enabled: true,
        status: 'active'
    });


    // --- EXECUTE ---
    await BATCH.commit();
    console.log("✅ Seeding Complete! Ready for Pilot Demo.");
}

// Run (Self-executing if called directly)
if (require.main === module) {
    seedPilotData().catch(console.error);
}

export { seedPilotData };
