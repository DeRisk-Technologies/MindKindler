"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { RolloutProgram } from "@/types/schema";
import { computeReadiness, ReadinessScore } from "@/govintel/rollout/readiness";
import { getAdoptionMetrics, AdoptionMetrics } from "@/govintel/rollout/adoption";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, RefreshCw, CheckSquare, Users, Download } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProgramDashboardPage() {
    const { programId } = useParams() as { programId: string };
    const router = useRouter();
    const { data: program, loading } = useFirestoreDocument<RolloutProgram>("rolloutPrograms", programId);
    const { toast } = useToast();
    
    const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
    const [metrics, setMetrics] = useState<AdoptionMetrics | null>(null);
    const [computing, setComputing] = useState(false);

    const handleCompute = async () => {
        setComputing(true);
        try {
            const r = await computeReadiness(programId);
            const m = await getAdoptionMetrics(programId);
            setReadiness(r);
            setMetrics(m);
            toast({ title: "Updated", description: "Latest metrics loaded." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setComputing(false);
        }
    };

    useEffect(() => {
        if (program) handleCompute();
    }, [program]);

    if (loading || !program) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleExport = () => {
        toast({ title: "Exported", description: "Go-Live Pack downloaded (Mock)." });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                    <div>
                        <h1 className="text-3xl font-bold">{program.name}</h1>
                        <p className="text-muted-foreground">Target: {new Date(program.targetGoLiveDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Export Pack</Button>
                    <Button onClick={handleCompute} disabled={computing}>
                        {computing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Refresh Status
                    </Button>
                </div>
            </div>

            {readiness && metrics ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Scorecard */}
                    <Card className="lg:col-span-1 bg-slate-50 border-slate-200">
                        <CardHeader><CardTitle>Readiness Score</CardTitle></CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-indigo-100">
                                <div className="text-4xl font-bold text-indigo-700">{readiness.totalScore}</div>
                            </div>
                            <div className="w-full mt-8 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium"><span>Governance</span><span>{readiness.breakdown.governance}/25</span></div>
                                    <Progress value={(readiness.breakdown.governance / 25) * 100} className="h-2"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium"><span>Training</span><span>{readiness.breakdown.training}/25</span></div>
                                    <Progress value={(readiness.breakdown.training / 25) * 100} className="h-2"/>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium"><span>Data Operations</span><span>{readiness.breakdown.data}/20</span></div>
                                    <Progress value={(readiness.breakdown.data / 20) * 100} className="h-2"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Modules */}
                    <div className="lg:col-span-2 grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => router.push(`/dashboard/govintel/rollout/${programId}/checklist`)}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Checklist</CardTitle>
                                    <CheckSquare className="h-4 w-4 text-muted-foreground"/>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage Tasks</div>
                                    <p className="text-xs text-muted-foreground">Governance & Config steps.</p>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => router.push(`/dashboard/govintel/rollout/${programId}/cohorts`)}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage People</div>
                                    <p className="text-xs text-muted-foreground">Assign training paths.</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader><CardTitle>Adoption Signals</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><div className="text-2xl font-bold">{metrics.activeUsers30d}</div><div className="text-xs text-muted-foreground">Active Users</div></div>
                                <div><div className="text-2xl font-bold">{metrics.assessmentsCompleted30d}</div><div className="text-xs text-muted-foreground">Assessments</div></div>
                                <div><div className="text-2xl font-bold">{metrics.trainingCompletionRate}%</div><div className="text-xs text-muted-foreground">Training Rate</div></div>
                                <div><div className="text-2xl font-bold text-red-600">{metrics.complianceFindings}</div><div className="text-xs text-muted-foreground">Compliance Issues</div></div>
                            </CardContent>
                        </Card>

                        {readiness.risks.length > 0 && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-800">Critical Risks</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside text-sm text-red-700">
                                        {readiness.risks.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center text-muted-foreground">Initializing metrics...</div>
            )}
        </div>
    );
}
