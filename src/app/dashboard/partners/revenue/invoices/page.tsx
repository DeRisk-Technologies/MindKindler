"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PartnerInvoice } from "@/partners/revenue/statements";
import { Badge } from "@/components/ui/badge";

export default function PartnerInvoicesPage() {
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    const q = query(collection(db, "partnerInvoices"), orderBy("issueDate", "desc"));
    const snap = await getDocs(q);
    setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerInvoice)));
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDownload = (html: string, number: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Partner Invoices</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issued Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{typeof inv.issueDate === 'string' ? inv.issueDate : inv.issueDate?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{inv.partnerId}</TableCell>
                  <TableCell>{inv.currency} {inv.amountDue.toFixed(2)}</TableCell>
                  <TableCell>{inv.dueDate?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'paid' ? 'default' : 'outline'}>
                        {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(inv.invoiceHtml, inv.invoiceNumber)}>
                        <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {invoices.length === 0 && !loading && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">No invoices issued yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
