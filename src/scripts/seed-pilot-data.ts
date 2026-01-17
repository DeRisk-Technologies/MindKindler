import * as admin from 'firebase-admin';
import { CaseFile, WorkTask } from '../types/case';
import { Finding } from '../types/report';
import { subWeeks, formatISO, addDays } from 'date-fns';

// --- Configuration ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'mindkindler-84fcf'
    });
}

const db = admin.firestore();

const weeksAgo = (weeks: number) => formatISO(subWeeks(new Date(), weeks));

/**
 * Seeding Script for the "Yorkshire Pilot" Scenario.
 */
async function seedPilotData() {
    console.log("🌱 Starting Pilot Data Seed...");

    const BATCH = db.batch();
    const TENANT_ID = 'pilot-tenant';
    const REGION = 'uk-north';

    // --- CASE A: XX Jeffery (The Drafting Demo) ---
    console.log("📝 Seeding Case A: XX Jeffery (Drafting Stage)...");
    
    const caseA_Id = 'case-a-jeffery';
    const studentId = 'stu-jeffery-01';
    
    // Create Tasks for Work Schedule Tab
    const tasksA: WorkTask[] = [
        { id: 't1', title: 'Intake: Review Request for Advice', type: 'admin', status: 'done' },
        { id: 't2', title: 'Consultation with Parent (Mrs Jeffery)', type: 'consultation', status: 'done', linkedAppointmentId: 'appt-1' },
        { id: 't3', title: 'School Observation at Clifton Green', type: 'observation', status: 'done', linkedEvidenceId: 'obs-1' },
        { id: 't4', title: 'Draft Statutory Advice (Appendix D)', type: 'drafting', status: 'pending', dueDate: addDays(new Date(), 2).toISOString() }
    ];

    const caseA: CaseFile = {
        id: caseA_Id,
        tenantId: TENANT_ID,
        studentId: studentId,
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
        contract: {
            clientName: 'York City Council',
            serviceTypes: ['statutory_advice'],
            commissionedDate: weeksAgo(6),
            dueDate: addDays(new Date(), 14).toISOString(), 
            budgetHours: 6,
            specialInstructions: 'Specific focus on sensory needs and recent exclusions.'
        },
        workSchedule: tasksA,
        stakeholders: [
            { id: 'sh-mum', role: 'parent', name: 'MXX Jeffery', contactInfo: { email: 'mum@test.com' }, consentStatus: 'granted', contributionStatus: 'received' },
            { id: 'sh-senco', role: 'senco', name: 'Mrs. Teacher', contactInfo: { email: 'senco@clifton.sch.uk' }, consentStatus: 'granted', contributionStatus: 'received' }
        ],
        statutoryTimeline: {
            requestDate: weeksAgo(14), 
            decisionToAssessDeadline: weeksAgo(8), 
            evidenceDeadline: weeksAgo(2), 
            draftPlanDeadline: weeksAgo(-2), 
            finalPlanDeadline: weeksAgo(-6), 
            isOverdue: false
        },
        createdAt: weeksAgo(14),
        updatedAt: new Date().toISOString(),
        createdBy: 'system-seed',
        lastActivity: 'Drafting: Appendix D started'
    };

    const caseARef = db.collection('cases').doc(caseA_Id);
    BATCH.set(caseARef, caseA);

    // --- FORENSIC FILES (Knowledge Base) ---
    const files = [
        { name: 'Request for Advice - York Council.pdf', type: 'referral', date: weeksAgo(6) },
        { name: 'Parental Contribution (Section A).docx', type: 'evidence', date: weeksAgo(5) },
        { name: 'Clinic Letter - Pediatrician.pdf', type: 'medical', date: weeksAgo(10) }, 
        { name: 'School Attendance Log.xlsx', type: 'school_data', date: weeksAgo(4) }
    ];

    files.forEach((f, i) => {
        const docRef = db.collection('knowledgeDocuments').doc(`doc-case-a-${i}`);
        BATCH.set(docRef, {
            id: `doc-case-a-${i}`,
            tenantId: TENANT_ID,
            title: f.name,
            type: 'evidence',
            caseId: caseA_Id, 
            status: 'processed',
            metadata: {
                originalFileName: f.name,
                evidenceType: f.type,
                uploadDate: f.date
            },
            createdAt: f.date
        });
    });

    // --- EVIDENCE LAB: OBSERVATION ---
    const obsRef = db.collection('observations').doc('obs-1');
    BATCH.set(obsRef, {
        id: 'obs-1',
        caseId: caseA_Id,
        studentId: studentId,
        tenantId: TENANT_ID,
        date: weeksAgo(1),
        setting: 'Classroom - Literacy',
        notes: 'Student appeared distracted by noise in corridor. Put hands over ears 3 times.',
        metrics: {
            onTask: 45, // %
            offTask: 55,
            teacherInteraction: 10
        },
        status: 'finalized'
    });

    // --- EVIDENCE LAB: CONSULTATION (NEW) ---
    const sessRef = db.collection('consultation_sessions').doc('sess-1');
    BATCH.set(sessRef, {
        id: 'sess-1',
        caseId: caseA_Id,
        studentId: studentId,
        tenantId: TENANT_ID,
        title: 'Initial Parent Consultation',
        status: 'completed',
        startTime: weeksAgo(2),
        participants: ['MXX Jeffery (Mother)', 'Dr. EP'],
        summary: 'Mother reports good sleep but high anxiety in mornings.',
        transcript: [], // Mock empty for seed
        createdAt: weeksAgo(2)
    });

    // --- ASSESSMENT TEMPLATES (NEW) ---
    console.log("📚 Seeding Assessment Templates...");
    const templates = [
        {
            id: 'temp-reading',
            title: 'Reading Fluency Check',
            category: 'Literacy',
            questions: [
                { id: 'q1', text: 'Reads high frequency words (List 1)', type: 'scale', points: 10 },
                { id: 'q2', text: 'Decodes CVC words', type: 'boolean', points: 5, correctAnswer: true }
            ]
        },
        {
            id: 'temp-phonics',
            title: 'Phonics Screener (Year 1)',
            category: 'Literacy',
            questions: [
                { id: 'q1', text: 'Identify Phase 2 sounds (s, a, t, p)', type: 'boolean', points: 4, correctAnswer: true }
            ]
        },
        {
            id: 'temp-sdq',
            title: 'Strengths & Difficulties (SDQ)',
            category: 'SEMH',
            questions: [
                { id: 'q1', text: 'Considerate of other people\'s feelings', type: 'scale', options: ['Not True', 'Somewhat True', 'Certainly True'], points: 2 }
            ]
        }
    ];

    templates.forEach(t => {
        BATCH.set(db.collection('assessment_templates').doc(t.id), {
            ...t,
            tenantId: 'system', // Shared templates
            createdBy: 'system',
            createdAt: new Date().toISOString()
        });
    });

    // --- REPORTING ---
    const findingsA: Finding[] = [
        {
            id: 'f-cog-1',
            sourceId: 'Parent Advice (MXX)',
            category: 'cognition_learning',
            text: 'XX loves reading because it takes him to a different dimension. He has hyperlexic traits.',
            isContested: false,
            confidence: 0.95,
            topics: ['reading', 'interests']
        }
    ];

    const draftARef = db.collection('drafts').doc(`draft-${caseA_Id}`);
    BATCH.set(draftARef, {
        id: `draft-${caseA_Id}`,
        caseId: caseA_Id,
        findings: findingsA,
        narrativeSections: { background_history: "XX lives with his mother..." },
        provisionPlan: [], 
        createdAt: new Date().toISOString()
    });

    // --- EXECUTE ---
    await BATCH.commit();
    console.log("✅ Seeding Complete! 'XX Jeffery' Case is fully populated.");
}

if (require.main === module) {
    seedPilotData().catch(console.error);
}

export { seedPilotData };
