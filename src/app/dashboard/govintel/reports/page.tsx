"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GovReportsPage() {
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const { toast } = useToast();

    const handleExport = (snap: GovSnapshot) => {
        // Mock PDF generation
        toast({ title: "Report Exported", description: `Government Intelligence Report (${snap.period}) downloaded.` });
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Intelligence Reports</h1>
            <div className="grid gap-4">
                {snapshots.map(snap => (
                    <Card key={snap.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-bold">{snap.scopeType.toUpperCase()} Report - {snap.period}</div>
                                <div className="text-sm text-muted-foreground">Generated {new Date(snap.createdAt).toLocaleDateString()}</div>
                            </div>
                            <Button variant="outline" onClick={() => handleExport(snap)}>
                                <Download className="mr-2 h-4 w-4"/> PDF
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
