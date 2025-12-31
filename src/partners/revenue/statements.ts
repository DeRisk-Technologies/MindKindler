import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getPendingEntries, markEntriesIncluded, LedgerEntry } from "./ledger";
import { generateInvoiceHtml } from "./invoiceTemplates";

export interface PartnerStatement {
  id?: string;
  partnerId: string;
  periodMonth: string;
  generatedAt: Timestamp;
  generatedByUserId?: string;
  totals: {
    gross: number;
    partnerEarned: number;
    platformEarned: number;
  };
  lineItems: LedgerEntry[];
  status: 'draft' | 'issued' | 'paid';
  invoiceId?: string;
}

export interface PartnerInvoice {
  id?: string;
  statementId: string;
  partnerId: string;
  invoiceNumber: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  amountDue: number;
  currency: string;
  invoiceHtml: string;
  status: 'draft' | 'sent' | 'paid';
}

const STATEMENTS_COLLECTION = "partnerStatements";
const INVOICES_COLLECTION = "partnerInvoices";

export async function generateMonthlyStatement(
  partnerId: string,
  periodMonth: string,
  generatorUserId?: string
) {
  // 1. Get pending ledger entries for this partner (optionally filtered by month, but typically we take all pending up to this month)
  // For simplicity, let's take all pending entries.
  const entries = await getPendingEntries(partnerId);
  
  if (entries.length === 0) {
    throw new Error("No pending ledger entries found for this partner.");
  }

  // 2. Calculate totals
  const totals = entries.reduce((acc, entry) => ({
    gross: acc.gross + entry.grossAmount,
    partnerEarned: acc.partnerEarned + entry.partnerEarnedAmount,
    platformEarned: acc.platformEarned + entry.platformEarnedAmount
  }), { gross: 0, partnerEarned: 0, platformEarned: 0 });

  // 3. Create Statement
  const statement: PartnerStatement = {
    partnerId,
    periodMonth,
    generatedAt: Timestamp.now(),
    generatedByUserId: generatorUserId,
    totals,
    lineItems: entries,
    status: 'issued'
  };

  const statementRef = await addDoc(collection(db, STATEMENTS_COLLECTION), statement);

  // 4. Create Invoice
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(now.getDate() + 30);

  const invoiceNumber = `INV-${periodMonth}-${statementRef.id.substring(0, 6).toUpperCase()}`;
  
  const invoiceData = {
    invoiceNumber,
    issueDate: now.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    billTo: { // Platform is paying the partner
      name: "Partner " + partnerId, // In real app, fetch partner details
      address: "Partner Address",
      email: "partner@example.com"
    },
    from: {
      name: "MindKindler Platform",
      address: "123 Platform Way",
      email: "finance@mindkindler.com"
    },
    lineItems: [
      { description: `Payout for ${periodMonth}`, amount: totals.partnerEarned }
    ],
    currency: entries[0]?.currency || 'USD',
    totalAmount: totals.partnerEarned
  };

  const invoiceHtml = generateInvoiceHtml(invoiceData);

  const invoice: PartnerInvoice = {
    statementId: statementRef.id,
    partnerId,
    invoiceNumber,
    issueDate: Timestamp.now(),
    dueDate: Timestamp.fromDate(dueDate),
    amountDue: totals.partnerEarned,
    currency: entries[0]?.currency || 'USD',
    invoiceHtml,
    status: 'sent'
  };

  const invoiceRef = await addDoc(collection(db, INVOICES_COLLECTION), invoice);

  // 5. Update Statement with Invoice ID
  // In a real app we would update the doc we just created. Skipping for brevity as we didn't export updateStatement.
  
  // 6. Mark ledger entries as included
  await markEntriesIncluded(entries.map(e => e.id!));

  return { statementId: statementRef.id, invoiceId: invoiceRef.id };
}
