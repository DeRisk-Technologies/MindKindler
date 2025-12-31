"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { InterventionPlan } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
    studentId: string;
}

export default function InterventionList({ studentId }: Props) {
    const { data: plans, loading } = useFirestoreCollection<InterventionPlan>("interventionPlans", "createdAt", "desc");
    const studentPlans = plans.filter(p => p.studentId === studentId);
    const router = useRouter();
    const { toast } = useToast();
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const planData: Omit<InterventionPlan, 'id'> = {
                tenantId: "default",
                studentId,
                createdByEppId: auth.currentUser?.uid || "unknown",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                title: "New Intervention Plan",
                goals: [],
                recommendations: [],
                reviewDates: [],
                progressLogs: []
            };
            const ref = await addDoc(collection(db, "interventionPlans"), planData);
            router.push(`/dashboard/students/${studentId}/interventions/${ref.id}`);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="py-8 text-center"><Loader2 className="animate-spin inline"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Intervention Plans</h3>
                <Button size="sm" onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create Plan
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentPlans.map(plan => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.title}</TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{plan.status}</Badge></TableCell>
                                    <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/students/${studentId}/interventions/${plan.id}`)}>
                                            Open <ChevronRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {studentPlans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No plans found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
