"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { SafeguardingIncident } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldAlert, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SafeguardingListPage() {
    const { data: incidents, loading } = useFirestoreCollection<SafeguardingIncident>("safeguardingIncidents", "createdAt", "desc");
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [category, setCategory] = useState("other");
    const [severity, setSeverity] = useState("medium");
    const [description, setDescription] = useState("");
    const [studentId, setStudentId] = useState(""); // Simplified: manual ID entry for v1

    const handleCreate = async () => {
        if (!description || !studentId) return;
        setIsSaving(true);
        try {
            const incidentData: Omit<SafeguardingIncident, 'id'> = {
                tenantId: "default",
                createdByUserId: auth.currentUser?.uid || "unknown",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                subjectStudentId: studentId,
                category: category as any,
                severity: severity as any,
                description,
                status: "open",
                timelineEvents: [{
                    at: new Date().toISOString(),
                    byUserId: auth.currentUser?.uid || "unknown",
                    action: "created",
                    notes: "Incident reported"
                }]
            };
            await addDoc(collection(db, "safeguardingIncidents"), incidentData);
            toast({ title: "Incident Reported", description: "Safeguarding team notified." });
            setOpen(false);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Safeguarding</h1>
                    <p className="text-muted-foreground">Incident reporting and case management.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button variant="destructive"><ShieldAlert className="mr-2 h-4 w-4"/> Report Incident</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Report Safeguarding Incident</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Student ID</Label>
                                <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter ID..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="abuse">Abuse</SelectItem>
                                            <SelectItem value="neglect">Neglect</SelectItem>
                                            <SelectItem value="selfHarm">Self Harm</SelectItem>
                                            <SelectItem value="bullying">Bullying</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Severity</Label>
                                    <Select value={severity} onValueChange={setSeverity}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the concern..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="destructive" onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit Report
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incidents.map(inc => (
                                <TableRow key={inc.id}>
                                    <TableCell>{new Date(inc.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="capitalize">{inc.category}</TableCell>
                                    <TableCell>
                                        <Badge variant={inc.severity === 'critical' ? 'destructive' : inc.severity === 'high' ? 'outline' : 'secondary'} className="uppercase text-[10px]">
                                            {inc.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{inc.status}</Badge></TableCell>
                                    <TableCell className="font-mono text-xs">{inc.subjectStudentId.substring(0,8)}...</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/intelligence/safeguarding/${inc.id}`)}>
                                            View <ChevronRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
