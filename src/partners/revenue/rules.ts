import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";

export interface RevenueRule {
  id?: string;
  tenantId?: string | null;
  partnerId?: string | null;
  appliesTo: 'marketplace' | 'deal';
  itemType?: string; // assessmentTemplate, trainingBundle, etc.
  regionTag?: string;
  commissionPercent: number;
  effectiveFrom: Timestamp;
  status: 'active' | 'archived';
  notes?: string;
}

const COLLECTION = "partnerRevenueRules";

export async function getApplicableRule(
  tenantId: string | null,
  partnerId: string | null,
  itemType: string,
  regionTag?: string
): Promise<RevenueRule | null> {
  const rulesRef = collection(db, COLLECTION);
  const q = query(rulesRef, where("status", "==", "active"));
  
  const snapshot = await getDocs(q);
  const allRules = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RevenueRule));

  // Sort by specificity
  // Priority: 
  // 1. Exact Tenant + Partner + Item
  // 2. Tenant + Item
  // 3. Partner + Item
  // 4. Global (no tenant, no partner)

  const sortedRules = allRules.sort((a, b) => {
    const scoreA = getSpecificityScore(a, tenantId, partnerId, itemType);
    const scoreB = getSpecificityScore(b, tenantId, partnerId, itemType);
    return scoreB - scoreA;
  });

  // Return the first one that actually matches the criteria
  return sortedRules.find(r => matches(r, tenantId, partnerId, itemType, regionTag)) || null;
}

function getSpecificityScore(rule: RevenueRule, tenantId: string | null, partnerId: string | null, itemType: string): number {
  let score = 0;
  if (rule.tenantId && rule.tenantId === tenantId) score += 4;
  if (rule.partnerId && rule.partnerId === partnerId) score += 2;
  if (rule.itemType && rule.itemType === itemType) score += 1;
  return score;
}

function matches(rule: RevenueRule, tenantId: string | null, partnerId: string | null, itemType: string, regionTag?: string): boolean {
  if (rule.tenantId && rule.tenantId !== tenantId) return false;
  if (rule.partnerId && rule.partnerId !== partnerId) return false;
  if (rule.itemType && rule.itemType !== itemType) return false;
  if (rule.regionTag && regionTag && rule.regionTag !== regionTag) return false;
  return true;
}

export async function createRule(rule: RevenueRule) {
  return await addDoc(collection(db, COLLECTION), rule);
}

export const DEFAULT_COMMISSION_PERCENT = 30; // 30% to platform by default if no rule
