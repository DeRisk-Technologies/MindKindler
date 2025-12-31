"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { RolloutProgram } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Rocket, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function RolloutListPage() {
    const { data: programs, loading } = useFirestoreCollection<RolloutProgram>("rolloutPrograms", "createdAt", "desc");
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [name, setName] = useState("");
    const [scopeType, setScopeType] = useState("council");
    const [targetDate, setTargetDate] = useState("");

    const handleCreate = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            const data: Omit<RolloutProgram, 'id'> = {
                tenantId: "default",
                scopeType: scopeType as any,
                scopeId: "demo",
                name,
                status: "planning",
                startDate: new Date().toISOString(),
                targetGoLiveDate: targetDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                owners: [auth.currentUser?.uid || "unknown"],
                notes: "",
                createdAt: new Date().toISOString()
            };
            const ref = await addDoc(collection(db, "rolloutPrograms"), data);
            toast({ title: "Program Created", description: "Configuring rollout..." });
            setOpen(false);
            router.push(`/dashboard/govintel/rollout/${ref.id}`);
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
                    <h1 className="text-3xl font-bold">Rollout Toolkit</h1>
                    <p className="text-muted-foreground">Manage onboarding, cohorts, and go-live readiness.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Program</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Rollout Program</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Program Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Council A - Phase 1" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Scope</Label>
                                <Select value={scopeType} onValueChange={setScopeType}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="council">Council</SelectItem>
                                        <SelectItem value="state">State</SelectItem>
                                        <SelectItem value="federal">Federal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Target Go-Live</Label>
                                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Start Program
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
                                <TableHead>Name</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Target Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programs.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Rocket className="h-4 w-4 text-indigo-500"/> {p.name}
                                    </TableCell>
                                    <TableCell className="capitalize">{p.scopeType}</TableCell>
                                    <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                                    <TableCell>{new Date(p.targetGoLiveDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/govintel/rollout/${p.id}`)}>
                                            Manage <ChevronRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && programs.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active rollouts.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
