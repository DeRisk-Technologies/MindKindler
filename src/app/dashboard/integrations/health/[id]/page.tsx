"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { runSync } from "@/integrations/framework/syncEngine";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function IntegrationDetailPage() {
    const { id } = useParams() as { id: string };
    const { data: runs, loading } = useFirestoreCollection<any>("syncRuns", "startedAt", "desc");
    const { toast } = useToast();
    const [syncing, setSyncing] = useState(false);

    // Filter runs for this integration
    const integrationRuns = runs.filter(r => r.integrationId === id);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await runSync(id, ['students']); // Mock entity selection
            toast({ title: "Sync Started", description: "Job queued successfully." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Connector Details</h1>
                <Button onClick={handleSync} disabled={syncing}>
                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>} 
                    Run Sync Now
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Run History</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Records</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {integrationRuns.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{new Date(r.startedAt).toLocaleString()}</TableCell>
                                        <TableCell className="capitalize">{r.runType}</TableCell>
                                        <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                                        <TableCell>{r.counts?.created || 0} Created</TableCell>
                                    </TableRow>
                                ))}
                                {integrationRuns.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">No history.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Students</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">Healthy</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Teachers</span>
                                    <Badge variant="secondary">Paused</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
