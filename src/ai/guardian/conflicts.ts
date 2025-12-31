import { db } from "@/lib/firebase";
import { PolicyRule, PolicyConflict } from "@/types/schema";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

/**
 * Policy Hygiene Engine
 * Detects conflicts, duplicates, and configuration issues in policy rules.
 */

export async function detectConflicts(): Promise<PolicyConflict[]> {
    const rulesSnap = await getDocs(collection(db, "policyRules"));
    const rules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PolicyRule));
    const activeRules = rules.filter(r => r.enabled && r.status === 'active');

    const conflicts: PolicyConflict[] = [];

    // 1. Detect Duplicates (Same Title + Jurisdiction)
    const titleMap = new Map<string, PolicyRule[]>();
    for (const r of activeRules) {
        const key = `${r.jurisdiction}-${r.title}`;
        if (!titleMap.has(key)) titleMap.set(key, []);
        titleMap.get(key)?.push(r);
    }

    for (const [key, group] of titleMap.entries()) {
        if (group.length > 1) {
            conflicts.push({
                id: `conflict_${Date.now()}_${Math.random()}`,
                tenantId: group[0].tenantId,
                detectedAt: new Date().toISOString(),
                severity: 'warning',
                conflictType: 'duplicate_active_rules',
                ruleIds: group.map(r => r.id),
                description: `Multiple active rules found for "${key}". This may cause redundant evaluations.`,
                status: 'open'
            });
        }
    }

    // 2. Detect Collisions (Same Trigger + Mixed Modes)
    const triggerMap = new Map<string, PolicyRule[]>();
    for (const r of activeRules) {
        const key = `${r.triggerEvent}-${r.triggerCondition}`;
        if (!triggerMap.has(key)) triggerMap.set(key, []);
        triggerMap.get(key)?.push(r);
    }

    for (const [key, group] of triggerMap.entries()) {
        const modes = new Set(group.map(r => r.mode));
        if (modes.has('enforce') && modes.has('advisory')) {
             conflicts.push({
                id: `conflict_${Date.now()}_${Math.random()}`,
                tenantId: group[0].tenantId,
                detectedAt: new Date().toISOString(),
                severity: 'critical',
                conflictType: 'enforcement_collision',
                ruleIds: group.map(r => r.id),
                description: `Mixed enforcement modes detected for trigger "${key}". Behavior may be unpredictable.`,
                status: 'open'
            });
        }
    }

    // 3. Persist Conflicts
    // In real app, we'd upsert based on hash to avoid noise
    // For mock, just return found
    return conflicts;
}
