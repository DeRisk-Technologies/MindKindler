"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { RolloutCohort, TrainingAssignment, LearningPath } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, BookOpen, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function CohortManagerPage() {
    const { programId } = useParams() as { programId: string };
    const { data: cohorts } = useFirestoreCollection<RolloutCohort>("rolloutCohorts");
    const { data: paths } = useFirestoreCollection<LearningPath>("learningPaths"); // Assume exists
    const programCohorts = cohorts.filter(c => c.programId === programId);
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [name, setName] = useState("");
    const [audience, setAudience] = useState("teacher");
    const [pathId, setPathId] = useState("");

    const handleCreate = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            // 1. Create Cohort
            const cohortData = {
                programId,
                name,
                audience,
                assignedTrainingPathId: pathId,
                userIds: ["mock_user_1", "mock_user_2"], // Mock users for v1
                completionRate: 0,
                tenantId: "default"
            };
            const cohortRef = await addDoc(collection(db, "rolloutCohorts"), cohortData);

            // 2. Auto-Assign Training
            if (pathId) {
                const batchPromises = cohortData.userIds.map(uid => 
                    addDoc(collection(db, "trainingAssignments"), {
                        tenantId: "default",
                        assignedByUserId: "system",
                        assignedToType: "user",
                        assignedToId: uid,
                        learningPathId: pathId,
                        status: "active",
                        createdAt: new Date().toISOString()
                    })
                );
                await Promise.all(batchPromises);
            }

            toast({ title: "Cohort Created", description: `Assigned training to ${cohortData.userIds.length} users.` });
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
                <h1 className="text-2xl font-bold">Manage Cohorts</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Cohort</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create User Cohort</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Cohort Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pilot Teachers Phase 1" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Audience</Label>
                                <Select value={audience} onValueChange={setAudience}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teacher">Teachers</SelectItem>
                                        <SelectItem value="parent">Parents</SelectItem>
                                        <SelectItem value="admin">Admins</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Assign Learning Path</Label>
                                <Select value={pathId} onValueChange={setPathId}>
                                    <SelectTrigger><SelectValue placeholder="Select path..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="path_safeguarding">Safeguarding Basics (Mock)</SelectItem>
                                        <SelectItem value="path_inclusion">Inclusion Training (Mock)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create & Assign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {programCohorts.map(c => (
                    <Card key={c.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-slate-500"/>
                                </div>
                                <div>
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-xs text-muted-foreground">{c.userIds?.length || 0} Members • {c.audience}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                {c.assignedTrainingPathId && (
                                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                                        <BookOpen className="h-4 w-4"/> Training Assigned
                                    </div>
                                )}
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{c.completionRate || 0}%</div>
                                    <div className="text-xs text-muted-foreground">Completion</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {programCohorts.length === 0 && <div className="text-center py-12 text-muted-foreground">No cohorts defined.</div>}
            </div>
        </div>
    );
}
