import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import { getApplicableRule, DEFAULT_COMMISSION_PERCENT } from "./rules";

export interface LedgerEntry {
  id?: string;
  partnerId: string;
  tenantId: string;
  sourceType: 'marketplacePurchase' | 'dealWon';
  sourceId: string;
  itemId?: string;
  itemType?: string; // stored for easier reporting
  grossAmount: number;
  currency: string;
  commissionPercent: number;
  partnerEarnedAmount: number;
  platformEarnedAmount: number;
  periodMonth: string; // YYYY-MM
  createdAt: Timestamp;
  status: 'pending' | 'includedInStatement' | 'paid' | 'reversed';
  notes?: string;
}

const COLLECTION = "partnerRevenueLedger";

export async function createLedgerEntryFromPurchase(
  purchase: any // Type placeholder for marketplacePurchase
) {
  // Logic to determine commission
  const rule = await getApplicableRule(
    purchase.tenantId || null,
    purchase.partnerId || null,
    purchase.itemType || 'general'
  );

  const commissionPercent = rule ? rule.commissionPercent : DEFAULT_COMMISSION_PERCENT;
  
  // Platform takes commission%, Partner takes the rest
  const platformShare = (purchase.price * commissionPercent) / 100;
  const partnerShare = purchase.price - platformShare;
  
  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const entry: LedgerEntry = {
    partnerId: purchase.partnerId,
    tenantId: purchase.tenantId || 'global',
    sourceType: 'marketplacePurchase',
    sourceId: purchase.id,
    itemId: purchase.itemId,
    itemType: purchase.itemType,
    grossAmount: purchase.price,
    currency: purchase.currency || 'USD',
    commissionPercent,
    partnerEarnedAmount: partnerShare,
    platformEarnedAmount: platformShare,
    periodMonth,
    createdAt: Timestamp.now(),
    status: 'pending'
  };

  const docRef = await addDoc(collection(db, COLLECTION), entry);
  return { id: docRef.id, ...entry };
}

export async function getPendingEntries(partnerId: string, periodMonth?: string) {
  const coll = collection(db, COLLECTION);
  let q = query(coll, where("partnerId", "==", partnerId), where("status", "==", "pending"));
  
  if (periodMonth) {
    q = query(q, where("periodMonth", "==", periodMonth));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry));
}

export async function markEntriesIncluded(entryIds: string[]) {
  const batch = writeBatch(db);
  entryIds.forEach(id => {
    const ref = doc(db, COLLECTION, id);
    batch.update(ref, { status: 'includedInStatement' });
  });
  await batch.commit();
}
