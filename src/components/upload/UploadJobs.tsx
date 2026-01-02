// src/components/upload/UploadJobs.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function UploadJobs({ tenantId }: { tenantId: string }) {
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, `tenants/${tenantId}/assistant_upload_jobs`),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        
        return onSnapshot(q, (snap) => {
            setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, [tenantId]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {jobs.map(job => (
                    <div key={job.id} className="text-sm border-b pb-2 last:border-0">
                        <div className="flex justify-between mb-1">
                            <span className="font-medium">Batch #{job.id.slice(0,4)}</span>
                            <Badge variant={job.status === 'complete' ? 'default' : 'secondary'}>{job.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Progress value={(job.processedFiles / job.totalFiles) * 100} className="h-1.5 flex-1" />
                            <span>{job.processedFiles}/{job.totalFiles}</span>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No active jobs.</p>}
            </CardContent>
        </Card>
    );
}
