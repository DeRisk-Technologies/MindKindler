"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PartnerStatement, PartnerInvoice } from "@/partners/revenue/statements";

// Mock retrieving the current partner ID from auth context
const MOCK_PARTNER_ID = "partner_123";

export default function PartnerPortalRevenuePage() {
  const [statements, setStatements] = useState<PartnerStatement[]>([]);
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [stats, setStats] = useState({ earned: 0, pending: 0 });

  useEffect(() => {
    async function fetchData() {
      // 1. Statements
      const stmtQ = query(collection(db, "partnerStatements"), where("partnerId", "==", MOCK_PARTNER_ID), orderBy("generatedAt", "desc"));
      const stmtSnap = await getDocs(stmtQ);
      setStatements(stmtSnap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerStatement)));

      // 2. Invoices
      const invQ = query(collection(db, "partnerInvoices"), where("partnerId", "==", MOCK_PARTNER_ID), orderBy("issueDate", "desc"));
      const invSnap = await getDocs(invQ);
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerInvoice)));

      // 3. Simple Stats
      // Pending = sum of pending ledger items
      const ledgerQ = query(collection(db, "partnerRevenueLedger"), where("partnerId", "==", MOCK_PARTNER_ID), where("status", "==", "pending"));
      const ledgerSnap = await getDocs(ledgerQ);
      let pendingSum = 0;
      ledgerSnap.forEach(d => pendingSum += d.data().partnerEarnedAmount || 0);

      // Earned = sum of paid statements
      let earnedSum = 0;
      stmtSnap.docs.forEach(d => {
          if (d.data().status === 'paid') earnedSum += d.data().totals.partnerEarned;
      });

      setStats({ earned: earnedSum, pending: pendingSum });
    }
    fetchData();
  }, []);

  const handleDownloadInvoice = (html: string, number: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Earnings</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">${stats.pending.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Accruing for next statement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Recent Statements</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statements.slice(0, 5).map(s => (
                            <TableRow key={s.id}>
                                <TableCell>{s.periodMonth}</TableCell>
                                <TableCell>${s.totals.partnerEarned.toFixed(2)}</TableCell>
                                <TableCell className="capitalize">{s.status}</TableCell>
                            </TableRow>
                        ))}
                         {statements.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No statements.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Download</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.slice(0, 5).map(i => (
                            <TableRow key={i.id}>
                                <TableCell>{i.invoiceNumber}</TableCell>
                                <TableCell>{i.issueDate?.toDate().toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(i.invoiceHtml, i.invoiceNumber)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {invoices.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No invoices.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
