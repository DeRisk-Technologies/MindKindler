"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { TrainingAssignment, TrainingCompletion } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function AssignmentsPage() {
    const { data: assignments, loading } = useFirestoreCollection<TrainingAssignment>("trainingAssignments", "createdAt", "desc");
    const { data: completions } = useFirestoreCollection<TrainingCompletion>("trainingCompletions", "completedAt", "desc");
    const router = useRouter();

    // Filter for current user (mocked auth check)
    const myAssignments = assignments.filter(a => a.assignedToId === (auth.currentUser?.uid || "unknown"));
    const myCompletions = completions.filter(c => c.userId === (auth.currentUser?.uid || "unknown"));

    const isCompleted = (moduleId?: string) => myCompletions.some(c => c.moduleId === moduleId);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Training</h1>
                <p className="text-muted-foreground">Assigned learning modules and history.</p>
            </div>

            <div className="grid gap-8">
                <Card>
                    <CardHeader><CardTitle>Active Assignments</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module ID</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myAssignments.map(a => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-mono text-xs">{a.moduleId}</TableCell>
                                        <TableCell>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No Due Date"}</TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{a.priority}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {isCompleted(a.moduleId) ? (
                                                <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1"/> Done</Badge>
                                            ) : (
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/training/library/${a.moduleId}`)}>
                                                    <PlayCircle className="h-4 w-4 mr-2"/> Start
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {myAssignments.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No active assignments.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Completion History</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Completed At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myCompletions.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-mono text-xs">{c.moduleId}</TableCell>
                                        <TableCell>{new Date(c.completedAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
