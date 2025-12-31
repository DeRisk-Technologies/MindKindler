"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PartnerStatement, generateMonthlyStatement } from "@/partners/revenue/statements";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function PartnerStatementsPage() {
  const [statements, setStatements] = useState<PartnerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genPartnerId, setGenPartnerId] = useState("");
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const loadStatements = async () => {
    setLoading(true);
    const q = query(collection(db, "partnerStatements"), orderBy("generatedAt", "desc"));
    const snap = await getDocs(q);
    setStatements(snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerStatement)));
    setLoading(false);
  };

  useEffect(() => {
    loadStatements();
  }, []);

  const handleGenerate = async () => {
      try {
          if (!genPartnerId) {
              toast({ title: "Error", description: "Partner ID is required", variant: "destructive" });
              return;
          }
          await generateMonthlyStatement(genPartnerId, genMonth, "admin");
          setIsGenOpen(false);
          toast({ title: "Success", description: "Statement generated successfully." });
          loadStatements();
      } catch (err: any) {
          toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Partner Statements</h2>
        <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
            <DialogTrigger asChild>
                <Button>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate New
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Monthly Statement</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Partner ID</Label>
                        <Input 
                            value={genPartnerId} 
                            onChange={e => setGenPartnerId(e.target.value)} 
                            className="col-span-3"
                            placeholder="e.g. partner_123"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Month</Label>
                        <Input 
                            type="month"
                            value={genMonth} 
                            onChange={e => setGenMonth(e.target.value)} 
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate}>Generate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Partner Earned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((stmt) => (
                <TableRow key={stmt.id}>
                  <TableCell>{stmt.periodMonth}</TableCell>
                  <TableCell>{stmt.partnerId}</TableCell>
                  <TableCell>${stmt.totals.gross.toFixed(2)}</TableCell>
                  <TableCell className="font-medium text-green-600">${stmt.totals.partnerEarned.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{stmt.status}</TableCell>
                  <TableCell className="text-right">
                    {stmt.invoiceId && (
                        <Button variant="ghost" size="sm" asChild>
                            <a href={`/dashboard/partners/revenue/statements/${stmt.id}`}>View</a>
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {statements.length === 0 && !loading && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No statements generated yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
