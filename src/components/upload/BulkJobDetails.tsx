// src/components/upload/BulkJobDetails.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface BulkJobDetailsProps {
    tenantId: string;
    jobId: string;
}

export function BulkJobDetails({ tenantId, jobId }: BulkJobDetailsProps) {
    const [job, setJob] = useState<any>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, `tenants/${tenantId}/assistant_upload_jobs/${jobId}`), (snap) => {
            if (snap.exists()) setJob(snap.data());
        });
        return unsub;
    }, [tenantId, jobId]);

    if (!job) return <div>Loading job...</div>;

    const percent = job.totalFiles > 0 ? (job.processedFiles / job.totalFiles) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Batch Status: {job.status}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={percent} />
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Processed: {job.processedFiles} / {job.totalFiles}</span>
                    <span>Errors: {job.errors?.length || 0}</span>
                </div>

                {job.errors?.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc pl-4 text-xs">
                                {job.errors.slice(0, 3).map((e: any, i: number) => (
                                    <li key={i}>{e.fileName}: {e.error}</li>
                                ))}
                                {job.errors.length > 3 && <li>...and {job.errors.length - 3} more</li>}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
