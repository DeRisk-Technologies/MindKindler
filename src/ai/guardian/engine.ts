// src/ai/guardian/engine.ts

import { db } from "@/lib/firebase";
import { GuardianEvent, GuardianFinding, PolicyRule, GuardianOverrideRequest } from "@/types/schema";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import * as Triggers from "./triggers";

/**
 * Guardian Engine
 * Evaluates events against active Policy Rules.
 * Now supports Enforcement Mode, Overrides, and Simulation Mode.
 */

export interface EvaluationResult {
    findings: GuardianFinding[];
    canProceed: boolean;
    blockingFindings: GuardianFinding[];
}

export async function evaluateEvent(event: GuardianEvent): Promise<GuardianFinding[] & { canProceed?: boolean, blockingFindings?: GuardianFinding[] }> {
    console.log(`[Guardian] Evaluating event: ${event.eventType}`);

    // 1. Load applicable rules (Active Only)
    // In production, these should be cached to avoid DB hits on every keystroke
    const rulesQuery = query(
        collection(db, "policyRules"),
        where("triggerEvent", "==", event.eventType),
        where("enabled", "==", true),
        where("status", "==", "active") // Phase 3C-2: Versioning
    );
    
    // Fallback if no rules found (e.g. fresh install)
    let rules: PolicyRule[] = [];
    try {
        const snapshot = await getDocs(rulesQuery);
        rules = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PolicyRule));
    } catch (e) {
        console.warn("[Guardian] Failed to fetch policy rules, using default safe mode.", e);
        // Default rule: Block safeguarding keywords in messages if no DB
        if (event.eventType === 'message_send') {
            rules.push({
                id: 'default_safeguarding',
                tenantId: event.tenantId,
                name: 'Default Safeguarding Check',
                description: 'Built-in check for safeguarding keywords',
                severity: 'critical',
                triggerEvent: 'message_send',
                triggerCondition: 'safeguarding_recommended',
                mode: 'enforce',
                blockActions: true,
                enabled: true,
                status: 'active'
            });
        }
    }

    const findings: GuardianFinding[] = [];
    const blockingFindings: GuardianFinding[] = [];

    // 2. Evaluate Rules
    for (const rule of rules) {
        let violationMsg: string | null = null;

        if (rule.triggerCondition === 'missing_consent') {
            violationMsg = Triggers.checkConsent(event.context);
        } else if (rule.triggerCondition === 'missing_metadata') {
            violationMsg = Triggers.checkMetadata(event.context);
        } else if (rule.triggerCondition === 'pii_leak') {
            violationMsg = Triggers.checkPII(event.context);
        } else if (rule.triggerCondition === 'safeguarding_recommended') {
            violationMsg = Triggers.checkSafeguarding(event.context);
        }

        if (violationMsg) {
            // Check Override
            let isOverridden = false;
            try {
                const overrideQuery = query(
                    collection(db, "guardianOverrideRequests"),
                    where("subjectId", "==", event.subjectId),
                    where("ruleIds", "array-contains", rule.id),
                    where("status", "==", "approved")
                );
                const overrideSnap = await getDocs(overrideQuery);
                isOverridden = !overrideSnap.empty;
            } catch (e) {
                // Ignore override check failure
            }

            // Phase 3C-2: Simulation Mode
            // If rolloutMode is 'simulate', we force blocking = false
            const isSimulated = rule.rolloutMode === 'simulate';
            const isBlocking = !isSimulated && rule.mode === 'enforce' && rule.severity === 'critical' && rule.blockActions && !isOverridden;

            const finding: GuardianFinding = {
                id: `find_${Date.now()}_${Math.random()}`, 
                tenantId: event.tenantId,
                ruleId: rule.id,
                severity: rule.severity,
                eventType: event.eventType,
                subjectType: event.subjectType,
                subjectId: event.subjectId,
                message: violationMsg,
                remediation: rule.remediation,
                status: isOverridden ? 'overridden' : 'open',
                createdAt: new Date().toISOString(),
                blocking: isBlocking,
                simulated: isSimulated // UI Badge
            };
            findings.push(finding);
            if (isBlocking) {
                blockingFindings.push(finding);
            }
        }
    }

    // 3. Persist Findings (Async)
    if (findings.length > 0) {
        // Fire and forget logging
        const batchPromises = findings.map(async (f) => {
            try {
                const { id, ...data } = f; 
                await addDoc(collection(db, "guardianFindings"), data);
            } catch (e) {
                console.error("[Guardian] Failed to log finding", e);
            }
        });
        // We don't await this to keep UI snappy, unless it's critical? 
        // For now, let's await to ensure audit trail before proceeding
        await Promise.all(batchPromises); 
    }

    const result = findings as GuardianFinding[] & { canProceed?: boolean, blockingFindings?: GuardianFinding[] };
    result.canProceed = blockingFindings.length === 0;
    result.blockingFindings = blockingFindings;

    return result;
}
