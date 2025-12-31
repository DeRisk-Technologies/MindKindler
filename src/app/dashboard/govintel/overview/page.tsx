"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSnapshot, GovSnapshot, formatMetric } from "@/analytics/govSnapshots";
import { useState, useEffect } from "react";
import { Loader2, TrendingUp, AlertTriangle, Shield, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreCollection } from "@/hooks/use-firestore";

export default function GovOverviewPage() {
    const [scope, setScope] = useState<"council"|"state"|"federal">("council");
    const [generating, setGenerating] = useState(false);
    const { toast } = useToast();
    
    // In real app, fetch latest snapshot from DB
    // For demo, we might just generate on load or button click
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const latest = snapshots.find(s => s.scopeType === scope);

    const handleRunSnapshot = async () => {
        setGenerating(true);
        try {
            await generateSnapshot(scope, "demo_id");
            toast({ title: "Snapshot Generated", description: "Dashboard updated with latest operational data." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Government Intelligence</h1>
                    <p className="text-muted-foreground">Aggregated education, safety, and compliance insights.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={scope} onValueChange={(v:any) => setScope(v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="council">Local Council</SelectItem>
                            <SelectItem value="state">State Ministry</SelectItem>
                            <SelectItem value="federal">Federal Government</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleRunSnapshot} disabled={generating}>
                        {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Refresh Data
                    </Button>
                </div>
            </div>

            {latest ? (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMetric(latest.metrics.interventions.active)}</div>
                            <p className="text-xs text-muted-foreground">Active Plans</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {latest.metrics.interventions.active > 0 
                                    ? ((latest.metrics.interventions.improving / latest.metrics.interventions.active) * 100).toFixed(0) + "%" 
                                    : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground">Showing Positive Impact</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Safeguarding</CardTitle>
                            <Shield className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatMetric(latest.metrics.safeguarding.critical)}</div>
                            <p className="text-xs text-muted-foreground">Critical Incidents</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Capacity Building</CardTitle>
                            <BookOpen className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMetric(latest.metrics.training.completions)}</div>
                            <p className="text-xs text-muted-foreground">Modules Completed</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    No data available for this scope. Click "Refresh Data" to generate a snapshot.
                </div>
            )}
        </div>
    );
}
