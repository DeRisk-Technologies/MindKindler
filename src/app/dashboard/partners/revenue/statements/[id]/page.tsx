"use client";

import { use, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PartnerStatement } from "@/partners/revenue/statements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function StatementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [statement, setStatement] = useState<PartnerStatement | null>(null);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "partnerStatements", id));
      if (snap.exists()) {
        setStatement({ id: snap.id, ...snap.data() } as PartnerStatement);
      }
    }
    load();
  }, [id]);

  const markPaid = async () => {
    try {
        await updateDoc(doc(db, "partnerStatements", id), { status: 'paid' });
        
        if (statement?.invoiceId) {
             // Find invoice and mark paid too (this is a shortcut, normally would be a transaction)
             // Since we don't have the invoice ID handy directly in a query without fetching,
             // we rely on the fact that real payment systems trigger this.
             // But for manual override:
             const invoiceRef = doc(db, "partnerInvoices", statement.invoiceId);
             await updateDoc(invoiceRef, { status: 'paid' });
        }

        setStatement(prev => prev ? ({ ...prev, status: 'paid' }) : null);
        toast({ title: "Updated", description: "Statement marked as PAID." });
    } catch (e) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  if (!statement) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
             <Link href="/dashboard/partners/revenue/statements">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Statement {statement.periodMonth}</h2>
                <p className="text-muted-foreground">Partner: {statement.partnerId}</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <Badge variant={statement.status === 'paid' ? 'default' : 'secondary'} className="text-lg">
                {statement.status.toUpperCase()}
            </Badge>
            {statement.status !== 'paid' && (
                <Button onClick={markPaid}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Paid
                </Button>
            )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Gross Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">${statement.totals.gross.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Partner Share</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">${statement.totals.partnerEarned.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Commission</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">${statement.totals.platformEarned.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Transactions included in this statement period.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead className="text-right">Net Payout</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {statement.lineItems.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell className="capitalize">{item.sourceType}</TableCell>
                            <TableCell>{item.itemType || 'Unknown'}</TableCell>
                            <TableCell>${item.grossAmount.toFixed(2)}</TableCell>
                            <TableCell>{item.commissionPercent}%</TableCell>
                            <TableCell className="text-right font-medium">${item.partnerEarnedAmount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
