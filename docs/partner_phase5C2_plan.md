# Partner Revenue & Ledger (Phase 5C-2) Implementation Plan

## 1. Overview
This phase implements the financial backbone for the Partner Marketplace. It handles revenue sharing calculations, immutable ledger entries, monthly statement generation, and invoice creation.

## 2. Data Model

### A. Revenue Rules (`partnerRevenueRules`)
Defines how commission is calculated.
- **Fields:** `ruleId`, `tenantId`, `partnerId`, `appliesTo` (marketplace|deal), `itemType`, `regionTag`, `commissionPercent`, `effectiveFrom`, `status`.
- **Logic:** Priority-based lookup (Specific -> Global).

### B. Revenue Ledger (`partnerRevenueLedger`)
Immutable record of all financial events.
- **Fields:** `ledgerId`, `partnerId`, `sourceType`, `sourceId`, `grossAmount`, `commissionPercent`, `partnerEarned`, `platformEarned`, `periodMonth`, `status` (pending|included|paid).

### C. Statements (`partnerStatements`)
Aggregated monthly view for a partner.
- **Fields:** `statementId`, `partnerId`, `periodMonth`, `totals` (gross, net), `lineItems` (snapshot of ledger entries), `status`.

### D. Invoices (`partnerInvoices`)
Formal document for payment processing.
- **Fields:** `invoiceId`, `statementId`, `invoiceNumber`, `amountDue`, `htmlContent`.

## 3. Implementation Steps

### Step 1: Core Logic (Lib)
- **`src/partners/revenue/rules.ts`**:
    - `findApplicableRule(...)`: Logic to find the best matching rule.
    - `calculateCommission(...)`: Returns amounts.
- **`src/partners/revenue/ledger.ts`**:
    - `createLedgerEntry(...)`: Creates document in Firestore.
    - `getLedgerStats(...)`: Aggregates for dashboards.
- **`src/partners/revenue/statements.ts`**:
    - `generateMonthlyStatement(...)`: Queries pending ledger items, creates statement, updates ledger items to 'includedInStatement'.
- **`src/partners/revenue/invoiceTemplates.ts`**:
    - `generateInvoiceHtml(...)`: Returns HTML string.

### Step 2: Backend Simulation
- Since we don't have real backend triggers for this phase in the prompt requirements (just "Implement"), we will likely build these as client-side admin actions or simulated functions called from the UI.
- *Note:* In a real app, `createLedgerEntry` would trigger on Firestore `onCreate` of a purchase. Here we will provide a utility to simulate it or ensure the UI calls it.

### Step 3: User Interface (Admin)
- **Overview**: `/dashboard/partners/revenue`
    - Stats cards (Unpaid Balance, YTD Revenue).
    - List of recent ledger entries.
- **Rules**: `/dashboard/partners/revenue/rules`
    - Table of active rules.
    - "Add Rule" dialog.
- **Statements**: `/dashboard/partners/revenue/statements`
    - Filterable list by Month/Partner.
    - "Generate Statements" action (batch or single).
- **Invoices**: `/dashboard/partners/revenue/invoices`
    - List of generated invoices.

### Step 4: User Interface (Partner Portal)
- **Revenue**: `/dashboard/partner-portal/revenue`
    - Read-only view of their own statements and invoices.
    - Simple earnings chart.

## 4. Manual Test Checklist
1. **Rule Logic**: Create a specific rule (e.g., 20%) and a global rule (30%). Verify calculations use the specific one when criteria match.
2. **Ledger Creation**: Simulate a $100 purchase. Verify ledger entry shows correct split (e.g., $80 partner, $20 platform).
3. **Statement Gen**: Run generation for current month. Verify ledger entry status changes to `includedInStatement`.
4. **Invoice Gen**: Verify HTML template renders with correct "Bill To" and amounts.
5. **Portal Access**: Verify a partner sees only their data.
