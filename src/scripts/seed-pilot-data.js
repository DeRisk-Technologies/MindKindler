const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { subWeeks, formatISO } = require('date-fns');

// --- Configuration ---
if (admin.apps.length === 0) {
    admin.initializeApp();
}

console.log("🌍 Connecting to Regional Database: mindkindler-uk");
const db = getFirestore(admin.app(), 'mindkindler-uk');

const weeksAgo = (weeks) => formatISO(subWeeks(new Date(), weeks));

// --- MARKETPLACE MODULE DEFINITION (Updated with REAL Stripe ID) ---
const UK_STATUTORY_OS = {
  "id": "uk_statutory_os",
  "name": "MindKindler Statutory OS (UK)",
  "description": "Complete Operating System for UK EHC Needs Assessments. Includes 20-Week Tracker, AI Clerk, Triangulation Engine, and The Guardian Risk Scanner.",
  "version": "2.0.0",
  "releaseDate": "2026-01-15",
  "publisher": "MindKindler Core",
  "price": 499.00,
  "stripePriceId": "price_1Sq0FyEyUMirDdEk3DX2s8xJ", // FIXED: Matches your Stripe Dashboard
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
    console.log("🌱 Starting Pilot Data Seed into 'mindkindler-uk'...");
    
    const BATCH = db.batch();

    // --- 1. MARKETPLACE INJECTION ---
    console.log("📦 Injecting UK Statutory OS Module into Marketplace...");
    const marketplaceRef = db.collection('marketplace_items').doc('uk_statutory_os');
    BATCH.set(marketplaceRef, UK_STATUTORY_OS);

    // ... (Existing Case Logic Omitted for Brevity - we only need to update the Marketplace Item) ...
    // Note: In a real run, keep the rest if you want to reset cases. For now, we focus on the fix.

    await BATCH.commit();
    console.log("✅ Seed Complete! Marketplace Item updated with correct Stripe ID.");
}

seedPilotData().catch(console.error);
