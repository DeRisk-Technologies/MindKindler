"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";
import { ProcurementPack, generatePack } from "@/govintel/procurement/generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProcurementPacksList() {
    const { data: packs, loading } = useFirestoreCollection<ProcurementPack>("procurementPacks", "createdAt", "desc");
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const router = useRouter();
    const { toast } = useToast();
    const [generating, setGenerating] = useState(false);

    // Wizard State
    const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
    const [jurisdiction, setJurisdiction] = useState("UK");

    const handleCreate = async () => {
        if (!selectedSnapshotId) return;
        setGenerating(true);
        try {
            const snap = snapshots.find(s => s.id === selectedSnapshotId);
            if (!snap) return;

            const pack = await generatePack(snap, { 
                scopeType: snap.scopeType, 
                scopeId: snap.scopeId, 
                jurisdiction 
            });

            const ref = await addDoc(collection(db, "procurementPacks"), {
                ...pack,
                createdByUserId: auth.currentUser?.uid || "unknown"
            });

            toast({ title: "Pack Generated", description: "Redirecting to editor..." });
            router.push(`/dashboard/govintel/procurement/${ref.id}`);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Procurement Packs</h1>
                    <p className="text-muted-foreground">Generate compliance and tender documentation.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Creator */}
                <Card>
                    <CardHeader><CardTitle>New Pack Wizard</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Source</label>
                            <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                                <SelectTrigger><SelectValue placeholder="Select snapshot..."/></SelectTrigger>
                                <SelectContent>
                                    {snapshots.map(s => <SelectItem key={s.id} value={s.id}>{s.scopeType.toUpperCase()} - {s.period}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jurisdiction</label>
                            <Select value={jurisdiction} onValueChange={setJurisdiction}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UK">United Kingdom</SelectItem>
                                    <SelectItem value="US">United States</SelectItem>
                                    <SelectItem value="EU">European Union</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={handleCreate} disabled={generating || !selectedSnapshotId}>
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}
                            Generate Pack
                        </Button>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Pack Archive</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Jurisdiction</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packs.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{p.jurisdiction}</TableCell>
                                        <TableCell><Badge variant={p.status === 'finalized' ? 'default' : 'outline'}>{p.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/govintel/procurement/${p.id}`)}>
                                                Open <ChevronRight className="ml-2 h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && packs.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No packs found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
