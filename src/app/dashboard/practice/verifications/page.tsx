// src/app/dashboard/practice/verifications/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, XCircle, FileSearch, ShieldCheck, Loader2 } from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { usePermissions } from '@/hooks/use-permissions';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';

export default function VerificationQueuePage() {
    const { shardId } = usePermissions();
    const { toast } = useToast();
    
    // Fetch pending tasks from Regional Shard
    // Assuming a collection group query or a dedicated 'verification_tasks' root collection for the practice
    // For now, let's fetch from the root 'verification_tasks' if available, or we might need to iterate students.
    // Simpler Pilot Approach: Store tasks in a root `tasks` collection in the shard.
    // If Student360Service puts them in `students/{id}/tasks`, we can't easily query all at once without collection group index.
    // Let's assume the service also writes to a `practice_tasks` feed for the tenant.
    
    // Fallback: Query 'students' and map alerts for the Pilot if tasks aren't separate yet.
    // But better: Student360Service.createStudentWithParents generated tasks. Let's see where.
    // It put them in `students/{id}/verification_tasks`.
    // We need a Collection Group Query here.
    
    // TEMPORARY MOCK for Pilot UI until Index is built:
    // We will list students with 'unverified' fields.
    const { data: students, loading } = useFirestoreCollection('students', 'createdAt', 'desc');

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Flatten students into a task list for the UI
    const tasks = students.flatMap(s => {
        const t = [];
        if (s.identity?.firstName?.metadata?.verified === false) t.push({ id: s.id + '_name', studentId: s.id, studentName: `${s.identity.firstName.value} ${s.identity.lastName.value}`, field: 'Identity', type: 'Manual Check', status: 'pending' });
        if (s.identity?.dateOfBirth?.metadata?.verified === false) t.push({ id: s.id + '_dob', studentId: s.id, studentName: `${s.identity.firstName.value} ${s.identity.lastName.value}`, field: 'Date of Birth', type: 'Document Review', status: 'pending' });
        return t;
    });

    const handleVerify = async () => {
        if (!selectedTask || !shardId) return;
        setIsVerifying(true);
        
        try {
            const db = getRegionalDb(shardId.replace('mindkindler-', ''));
            const studentRef = doc(db, 'students', selectedTask.studentId);
            
            // Construct update based on field
            // Simplified: Mark entire identity as verified for this demo action
            await updateDoc(studentRef, {
                'identity.firstName.metadata.verified': true,
                'identity.lastName.metadata.verified': true,
                'identity.dateOfBirth.metadata.verified': true,
                'meta.trustScore': 100, // Boost score
                updatedAt: serverTimestamp()
            });

            toast({ title: "Verified", description: "Field marked as verified. Trust score updated." });
            setSelectedTask(null);
            // In a real app, we'd refresh the list here
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
                    <p className="text-muted-foreground">Review manual data entries and validate against evidence.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Reviews ({tasks.length})</CardTitle>
                    <CardDescription>Items requiring manual provenance checks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Field / Data</TableHead>
                                <TableHead>Validation Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && tasks.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Queue empty. All records verified.</TableCell></TableRow>
                            )}
                            {tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.studentName}</TableCell>
                                    <TableCell>{task.field}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50">
                                            <FileSearch className="w-3 h-3 mr-1"/> {task.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => setSelectedTask(task)}>
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Verification Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Data: {selectedTask?.field}</DialogTitle>
                        <DialogDescription>
                            Confirm you have seen evidence (e.g., Birth Certificate, Passport) matching this record.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <div className="bg-slate-50 p-3 rounded border text-sm">
                            <strong>Value:</strong> {selectedTask?.studentName} (and related fields)
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Verification Note</label>
                            <Textarea placeholder="e.g. Sighted original Birth Certificate #12345" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
                        <Button onClick={handleVerify} disabled={isVerifying} className="bg-green-600 hover:bg-green-700">
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <ShieldCheck className="mr-2 h-4 w-4" /> Confirm Verified
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
