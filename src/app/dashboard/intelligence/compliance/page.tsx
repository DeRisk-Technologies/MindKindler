"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GuardianFinding, GuardianOverrideRequest } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, XCircle } from "lucide-react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ComplianceDashboardPage() {
    const { data: findings } = useFirestoreCollection<GuardianFinding>("guardianFindings", "createdAt", "desc");
    const { data: overrides } = useFirestoreCollection<GuardianOverrideRequest>("guardianOverrideRequests", "requestedAt", "desc");
    const { toast } = useToast();

    const resolveFinding = async (id: string) => {
        await updateDoc(doc(db, "guardianFindings", id), {
            status: "resolved",
            acknowledgedBy: "admin"
        });
        toast({ title: "Resolved", description: "Finding marked as handled." });
    };

    const handleOverride = async (req: GuardianOverrideRequest, status: 'approved' | 'rejected') => {
        await updateDoc(doc(db, "guardianOverrideRequests", req.id), {
            status,
            reviewedAt: new Date().toISOString(),
            reviewedByUserId: "admin"
        });
        toast({ title: `Request ${status}`, description: `Override request processed.` });
    };

    const openFindings = findings.filter(f => f.status !== 'resolved' && f.status !== 'overridden');
    const pendingOverrides = overrides.filter(o => o.status === 'pending');

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
                    <p className="text-muted-foreground">Monitor and resolve Guardian findings.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="w-40">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Overrides</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 text-2xl font-bold text-orange-600">{pendingOverrides.length}</CardContent>
                    </Card>
                    <Card className="w-40">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-muted-foreground">Open Issues</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 text-2xl font-bold text-red-600">{openFindings.length}</CardContent>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue="findings">
                <TabsList>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="overrides">Override Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="findings">
                    <Card>
                        <CardHeader><CardTitle>Recent Findings</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Context</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {openFindings.map(f => (
                                        <TableRow key={f.id}>
                                            <TableCell>
                                                <Badge variant={f.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase">
                                                    {f.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{f.message}</div>
                                                <div className="text-xs text-muted-foreground">{f.remediation}</div>
                                            </TableCell>
                                            <TableCell>{f.subjectType} / {f.eventType}</TableCell>
                                            <TableCell className="capitalize">{f.status}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => resolveFinding(f.id)}>
                                                    <Check className="mr-2 h-4 w-4" /> Resolve
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {openFindings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                                                All clear. No open compliance issues.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overrides">
                    <Card>
                        <CardHeader><CardTitle>Access Override Requests</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overrides.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.requestedByUserId}</TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={req.reason}>{req.reason}</TableCell>
                                            <TableCell>{req.eventType}</TableCell>
                                            <TableCell><Badge variant="outline">{req.status}</Badge></TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleOverride(req, 'approved')}>
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleOverride(req, 'rejected')}>
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {overrides.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No requests found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
