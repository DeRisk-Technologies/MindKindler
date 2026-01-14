import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

console.log("\n✈️  MindKindler Pre-Flight Check (v1.0 RC)");
console.log("==========================================");

const envPath = path.resolve(process.cwd(), '.env.local');

// 1. Check File Existence
if (!fs.existsSync(envPath)) {
    console.error("❌ CRITICAL: .env.local file not found in root directory.");
    console.error("   -> Run 'cp .env.local.example .env.local' and populate keys.");
    process.exit(1);
} else {
    console.log("✅ File Check: .env.local found.");
}

// 2. Load Config
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Merge with process.env for CI/CD compatibility
const combinedEnv = { ...envConfig, ...process.env };

const REQUIRED_KEYS = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'STRIPE_SECRET_KEY',
    'GOOGLE_GENAI_API_KEY',
    'SMTP_HOST'
];

let failed = false;

REQUIRED_KEYS.forEach(key => {
    const val = combinedEnv[key];
    if (!val || val.trim() === '') {
        console.error(`❌ FAIL: Missing required key: ${key}`);
        failed = true;
    } else {
        // Mask key for safe logging
        const masked = val.length > 8 ? `${val.substring(0, 4)}...${val.substring(val.length-4)}` : '****';
        console.log(`✅ PASS: ${key} is set.`);
    }
});

// 3. Logic Check
if (failed) {
    console.error("\n🚫 Pre-flight check failed. Environment configuration is incomplete.");
    console.error("   Aborting launch to prevent runtime errors.");
    process.exit(1);
}

console.log("\n✅ All systems go. Initializing Pilot Environment...");
process.exit(0);
