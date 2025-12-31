"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createRule, RevenueRule } from "@/partners/revenue/rules";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function RevenueRulesPage() {
  const [rules, setRules] = useState<RevenueRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  // New Rule Form State
  const [commission, setCommission] = useState("30");
  const [appliesTo, setAppliesTo] = useState("marketplace");
  const [partnerId, setPartnerId] = useState("");
  const [notes, setNotes] = useState("");

  const loadRules = async () => {
    setLoading(true);
    const q = query(collection(db, "partnerRevenueRules"), where("status", "==", "active"));
    const snap = await getDocs(q);
    setRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as RevenueRule)));
    setLoading(false);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreate = async () => {
    try {
        await createRule({
            appliesTo: appliesTo as 'marketplace' | 'deal',
            commissionPercent: parseFloat(commission),
            status: 'active',
            partnerId: partnerId || null,
            effectiveFrom: Timestamp.now(),
            notes
        });
        setIsOpen(false);
        toast({ title: "Rule Created", description: "New revenue rule is active." });
        loadRules();
    } catch (error) {
        toast({ title: "Error", description: "Failed to create rule.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Revenue Share Rules</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Rule
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Revenue Rule</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <Select value={appliesTo} onValueChange={setAppliesTo}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="marketplace">Marketplace Item</SelectItem>
                                <SelectItem value="deal">Deal Registration</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Commission %</Label>
                        <Input 
                            type="number" 
                            value={commission} 
                            onChange={e => setCommission(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Partner ID</Label>
                        <Input 
                            placeholder="Optional (Specific Partner)" 
                            value={partnerId} 
                            onChange={e => setPartnerId(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Notes</Label>
                        <Input 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Save Rule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Effective Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="capitalize">{rule.appliesTo}</TableCell>
                  <TableCell>{rule.partnerId ? `Partner: ${rule.partnerId}` : "Global"}</TableCell>
                  <TableCell>{rule.commissionPercent}% (Platform)</TableCell>
                  <TableCell>{rule.notes || "-"}</TableCell>
                  <TableCell>{rule.effectiveFrom?.toDate().toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && !loading && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No active rules found. Default 30% applies.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
