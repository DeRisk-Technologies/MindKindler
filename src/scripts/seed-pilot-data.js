const admin = require('firebase-admin');
const { subWeeks, formatISO } = require('date-fns');

// --- Configuration ---
// If not already initialized (e.g. by environment variables)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

const weeksAgo = (weeks) => formatISO(subWeeks(new Date(), weeks));

// --- MARKETPLACE MODULE DEFINITION (Copied from src/marketplace/catalog/uk_statutory_os.json) ---
const UK_STATUTORY_OS = {
  "id": "uk_statutory_os",
  "name": "MindKindler Statutory OS (UK)",
  "description": "Complete Operating System for UK EHC Needs Assessments. Includes 20-Week Tracker, AI Clerk, Triangulation Engine, and The Guardian Risk Scanner.",
  "version": "2.0.0",
  "releaseDate": "2026-01-15",
  "publisher": "MindKindler Core",
  "price": 499.00,
  "stripePriceId": "price_uk_statutory_os_v2",
  "subscriptionModel": "per_seat_month",
  "regionTags": ["UK"],
  "categories": ["Workflow", "AI", "Compliance"],
  "dependencies": ["uk_la_pack"],
  "capabilities": {
    "featureFlags": [
      { "key": "enable_statutory_workflow", "label": "20-Week Clock" },
      { "key": "enable_ai_clerk", "label": "Intelligent Intake" },
      { "key": "enable_triangulation", "label": "Evidence Triangulation" },
      { "key": "enable_guardian", "label": "Systemic Risk Scanner" }
    ],
    "statutory_timeline": {
      "standard": "SEND Code of Practice (2015)",
      "total_weeks": 20,
      "stages": [
        { "id": "intake", "week_start": 0, "week_end": 6, "label": "Intake & Decision" },
        { "id": "assessment", "week_start": 6, "week_end": 12, "label": "Evidence Gathering" },
        { "id": "drafting", "week_start": 12, "week_end": 16, "label": "Drafting & Synthesis" },
        { "id": "consultation", "week_start": 16, "week_end": 19, "label": "Consultation" },
        { "id": "final", "week_start": 19, "week_end": 20, "label": "Finalization" }
      ]
    },
    "installManifest": {
        "routes": ["/guardian", "/dashboard/case/:id/intake"]
    }
  }
};

async function seedPilotData() {
    console.log("🌱 Starting Pilot Data Seed...");
    console.log("🧹 Clearing collections...");

    const BATCH = db.batch();

    // --- 1. MARKETPLACE INJECTION ---
    console.log("📦 Injecting UK Statutory OS Module into Marketplace...");
    const marketplaceRef = db.collection('marketplace_items').doc('uk_statutory_os');
    BATCH.set(marketplaceRef, UK_STATUTORY_OS);

    // --- CASE A: XX Jeffery (The Drafting Demo) ---
    console.log("📝 Seeding Case A: XX Jeffery (Drafting Stage)...");
    
    const caseA_Id = 'case-a-jeffery';
    const caseA = {
        id: caseA_Id,
        tenantId: 'pilot-tenant',
        studentId: 'stu-jeffery-01',
        studentName: 'XX Jeffery',
        dob: '2014-05-12',
        upn: 'Z12345678',
        localAuthorityId: 'York City Council',
        region: 'uk-north',
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
            requestDate: weeksAgo(14), // 14 weeks ago
            decisionToAssessDeadline: weeksAgo(8),
            evidenceDeadline: weeksAgo(2),
            draftPlanDeadline: weeksAgo(-2),
            finalPlanDeadline: weeksAgo(-6),
            isOverdue: false
        },
        createdAt: weeksAgo(14),
        updatedAt: new Date().toISOString(),
        createdBy: 'system-seed'
    };

    const caseARef = db.collection('cases').doc(caseA_Id);
    BATCH.set(caseARef, caseA);

    const findingsA = [
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
            isContested: false,
            confidence: 0.9,
            topics: ['attendance', 'anxiety']
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


    // --- CASE B: Alex Jeffery (The Guardian Trigger - Sibling) ---
    console.log("🚨 Seeding Case B: Alex Jeffery (Sibling Risk)...");
    
    const caseB_Id = 'case-b-jeffery';
    const caseB = {
        id: caseB_Id,
        tenantId: 'pilot-tenant',
        studentName: 'Alex Jeffery',
        schoolId: 'Clifton Green Primary',
        status: 'assessment',
        flags: {
            safeguardingRisk: true,
            hasSocialWorker: true
        },
        statutoryTimeline: { requestDate: weeksAgo(4) },
        siblingCaseIds: [caseA_Id]
    };
    
    BATCH.set(db.collection('cases').doc(caseB_Id), caseB);


    // --- CASE C: Sarah Smith (The Breach Demo) ---
    console.log("⏰ Seeding Case C: Sarah Smith (Breach Risk)...");

    const caseC_Id = 'case-c-smith';
    const caseC = {
        id: caseC_Id,
        tenantId: 'pilot-tenant',
        studentId: 'stu-smith-01',
        studentName: 'Sarah Smith',
        dob: '2015-01-01',
        localAuthorityId: 'York City Council',
        region: 'uk-north',
        status: 'assessment',
        flags: { isNonVerbal: false, requiresGuardianPresence: false, hasSocialWorker: false, safeguardingRisk: false },
        stakeholders: [],
        statutoryTimeline: {
            requestDate: weeksAgo(22), // 22 WEEKS AGO = BREACH
            decisionToAssessDeadline: weeksAgo(16),
            evidenceDeadline: weeksAgo(10),
            draftPlanDeadline: weeksAgo(6),
            finalPlanDeadline: weeksAgo(2),
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
        tenantId: 'pilot-tenant',
        studentName: `Student ${i} York`,
        schoolId: schoolId,
        clinicalTags: ['self_harm', 'anxiety'],
        status: 'assessment',
        statutoryTimeline: { requestDate: weeksAgo(5) },
        updatedAt: new Date().toISOString()
    }));

    clusterCases.forEach(c => {
        BATCH.set(db.collection('cases').doc(c.id), c);
    });

    await BATCH.commit();
    console.log("✅ Seeding Complete! Marketplace and Cases injected.");
}

seedPilotData().catch(console.error);
