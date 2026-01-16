import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Initialize Admin SDK if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const REGION = "europe-west3"; // UK Region
const REGIONAL_DB = "mindkindler-uk"; // Targeted Shard

/**
 * The Guardian: Chat Scanner
 * Triggers when a new message is written to the regional chat collection.
 * Scans for PII and signs of Clinical Risk.
 */
export const guardianChatScanner = onDocumentCreated(
    {
        document: "chat_channels/{channelId}/messages/{messageId}",
        region: REGION,
        database: REGIONAL_DB, // Explicitly target the UK shard
        memory: "256MiB",
        maxInstances: 10
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const messageData = snapshot.data();
        const messageId = event.params.messageId;
        const channelId = event.params.channelId;
        
        // Prevent infinite loops if we are the ones updating
        if (messageData.guardian?.status !== 'pending') {
            return;
        }

        const content = messageData.content || "";
        const flags: string[] = [];
        let redactedContent = content;

        // --- 1. Regex PII Scanning (Basic) ---
        // UK Phone Numbers
        const phoneRegex = /(?:(?:\+44\s?|0)7\d{3}\s?\d{6})|(?:(?:\+44\s?|0)\d{2,5}\s?\d{3,6})/g;
        if (phoneRegex.test(content)) {
            flags.push("Phone Number Detected");
            redactedContent = content.replace(phoneRegex, "[REDACTED PHONE]");
        }

        // Email Addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        if (emailRegex.test(content)) {
            flags.push("Email Detected");
            redactedContent = content.replace(emailRegex, "[REDACTED EMAIL]");
        }

        // --- 2. Keyword Risk Scanning (Clinical) ---
        const riskKeywords = ["suicide", "self-harm", "kill myself", "abuse", "emergency"];
        const foundRisks = riskKeywords.filter(kw => content.toLowerCase().includes(kw));
        
        if (foundRisks.length > 0) {
            flags.push("CRITICAL RISK: " + foundRisks.join(", "));
            // TODO: In future, trigger analyzeConsultationInsight alert here
        }

        // --- 3. Update the Message ---
        const status = flags.length > 0 ? (foundRisks.length > 0 ? 'flagged' : 'redacted') : 'clean';
        
        await snapshot.ref.update({
            "guardian.status": status,
            "guardian.flaggedReason": flags,
            "guardian.redactedContent": status === 'redacted' ? redactedContent : null,
            "guardian.scanTimestamp": admin.firestore.Timestamp.now()
        });
        
        console.log(`Guardian scanned message ${messageId} in channel ${channelId}: Status=${status}, Flags=${flags.join(", ")}`);
    }
);
