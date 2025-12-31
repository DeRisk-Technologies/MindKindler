"use client";

import { useEffect, useState } from "react";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { ConsentRecord, ConsentType } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { addDoc, collection, doc, updateDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Props {
    studentId: string;
}

export function ConsentTab({ studentId }: Props) {
    // Custom hook usage for specific query
    const [consents, setConsents] = useState<ConsentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [type, setType] = useState<ConsentType>("assessment");
    const [notes, setNotes] = useState("");

    const fetchConsents = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "consents"), 
                where("subjectId", "==", studentId),
                orderBy("grantedAt", "desc")
            );
            const snap = await getDocs(q);
            setConsents(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsentRecord)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsents();
    }, [studentId]);

    const handleAdd = async () => {
        setIsSaving(true);
        try {
            const newConsent: Omit<ConsentRecord, 'id'> = {
                tenantId: "default",
                subjectType: "student",
                subjectId: studentId,
                consentType: type,
                status: "granted",
                grantedByUserId: auth.currentUser?.uid || "system",
                grantedAt: new Date().toISOString(),
                notes
            };
            await addDoc(collection(db, "consents"), newConsent);
            toast({ title: "Consent Granted", description: "Record updated successfully." });
            setOpen(false);
            fetchConsents(); // Refresh
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this consent?")) return;
        try {
            await updateDoc(doc(db, "consents", id), {
                status: "revoked",
                revokedAt: new Date().toISOString()
            });
            toast({ title: "Revoked", description: "Consent status updated." });
            fetchConsents();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Consents</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4"/> Grant Consent</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Record New Consent</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Consent Type</Label>
                                <Select value={type} onValueChange={(v:any) => setType(v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dataProcessing">Data Processing (GDPR)</SelectItem>
                                        <SelectItem value="assessment">Psychological Assessment</SelectItem>
                                        <SelectItem value="teleconsultation">Telehealth / Video</SelectItem>
                                        <SelectItem value="mediaRecording">Media Recording</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes / Evidence</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Signed form on file..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Grant
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
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Granted On</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consents.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium capitalize">{c.consentType.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.status === 'granted' ? 'default' : 'destructive'} className="capitalize">
                                            {c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(c.grantedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]">{c.notes}</TableCell>
                                    <TableCell className="text-right">
                                        {c.status === 'granted' && (
                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleRevoke(c.id)}>
                                                Revoke
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && consents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No consent records found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
