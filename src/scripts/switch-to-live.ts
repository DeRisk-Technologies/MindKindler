import * as fs from 'fs';
import * as path from 'path';

const PACK_PATH = path.join(__dirname, '../marketplace/catalog/uk_la_pack.json');

async function switchToLive() {
    console.log("🚀 Starting Switch to Live Mode Check...");

    // 1. Verify Pack Configuration
    if (!fs.existsSync(PACK_PATH)) {
        console.error("❌ UK LA Pack JSON not found!");
        process.exit(1);
    }

    const packData = JSON.parse(fs.readFileSync(PACK_PATH, 'utf-8'));
    const priceId = packData.stripePriceId;

    if (priceId && priceId.startsWith('price_') && !priceId.includes('test')) {
         console.log(`✅ UK LA Pack has a valid-looking Live Price ID: ${priceId}`);
    } else {
        console.warn(`⚠️ UK LA Pack Price ID looks suspicious or testing-related: ${priceId}`);
    }

    // 2. Instructions for Environment Variables
    console.log("\n📋 NEXT STEPS FOR PRODUCTION DEPLOYMENT:");
    console.log("----------------------------------------");
    console.log("1. Go to your Stripe Dashboard > Developers > API Keys.");
    console.log("2. Copy the 'Live Secret Key' (sk_live_...) and 'Live Publishable Key' (pk_live_...).");
    console.log("3. Set these secrets in Firebase Functions:");
    console.log("   firebase functions:secrets:set STRIPE_SECRET_KEY");
    console.log("   firebase functions:secrets:set STRIPE_PUBLISHABLE_KEY");
    console.log("4. Update your CI/CD pipeline variables or .env.production file.");
    console.log("5. Redeploy functions: firebase deploy --only functions");
    console.log("----------------------------------------");
    console.log("✅ Configuration check complete.");
}

switchToLive();
