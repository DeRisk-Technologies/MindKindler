"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Server, Database, Plus, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";

export default function IntegrationsHubPage() {
    const router = useRouter();
    // Mock jobs collection if not exists
    const { data: jobs } = useFirestoreCollection<any>("importJobs", "createdAt", "desc");

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Integration Hub</h1>
                <p className="text-muted-foreground">Manage data connectors and bulk imports.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => router.push('/dashboard/integrations/csv/new')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">CSV / Excel</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-green-600"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Bulk Import</div>
                        <p className="text-xs text-muted-foreground">Upload Students, Teachers, Classes.</p>
                        <Button size="sm" className="mt-4 w-full">Start Import</Button>
                    </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">OneRoster API</CardTitle>
                        <Server className="h-4 w-4"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SIS Sync</div>
                        <p className="text-xs text-muted-foreground">Coming Soon.</p>
                    </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ed-Fi</CardTitle>
                        <Database className="h-4 w-4"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Data Standard</div>
                        <p className="text-xs text-muted-foreground">Coming Soon.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><History className="h-4 w-4"/> Job History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {jobs.map((job: any) => (
                            <div key={job.id} className="flex items-center justify-between border-b pb-2">
                                <div>
                                    <div className="font-medium capitalize">{job.entityType} Import</div>
                                    <div className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold capitalize ${job.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>{job.status}</div>
                                    <div className="text-xs text-muted-foreground">{job.counts?.created || 0} Records</div>
                                </div>
                            </div>
                        ))}
                        {jobs.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No jobs run yet.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
