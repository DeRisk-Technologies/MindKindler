"use client";

import { useFirestoreCollection, useFirestoreDocument } from "@/hooks/use-firestore";
import { InterventionPlan } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function InterventionDetailPage() {
    const { id, planId } = useParams() as { id: string, planId: string };
    const router = useRouter();
    const { data: plan, loading } = useFirestoreDocument<InterventionPlan>("interventionPlans", planId);
    const { toast } = useToast();
    const [updating, setUpdating] = useState(false);

    // Score State
    const [baseline, setBaseline] = useState(0);
    const [target, setTarget] = useState(0);
    const [current, setCurrent] = useState(0);

    // Log State
    const [logNote, setLogNote] = useState("");
    const [logScoreDelta, setLogScoreDelta] = useState(0);

    useEffect(() => {
        if (plan) {
            setBaseline(plan.baselineScore || 0);
            setTarget(plan.targetScore || 0);
            setCurrent(plan.currentScore || 0);
        }
    }, [plan]);

    if (loading || !plan) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleSaveScores = async () => {
        setUpdating(true);
        try {
            await updateDoc(doc(db, "interventionPlans", planId), {
                baselineScore: baseline,
                targetScore: target,
                currentScore: current,
                updatedAt: new Date().toISOString()
            });
            toast({ title: "Scores Updated", description: "Impact tracking updated." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const handleAddLog = async () => {
        if (!logNote) return;
        setUpdating(true);
        try {
            const newCurrent = current + logScoreDelta;
            
            await updateDoc(doc(db, "interventionPlans", planId), {
                currentScore: newCurrent,
                updatedAt: new Date().toISOString(),
                progressLogs: arrayUnion({
                    at: new Date().toISOString(),
                    byUserId: auth.currentUser?.uid || "unknown",
                    note: logNote,
                    progressDelta: logScoreDelta > 0 ? `+${logScoreDelta}` : `${logScoreDelta}`
                })
            });
            setCurrent(newCurrent);
            setLogNote("");
            setLogScoreDelta(0);
            toast({ title: "Progress Logged", description: "Timeline updated." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const progressPercent = target > baseline ? ((current - baseline) / (target - baseline)) * 100 : 0;

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-2xl font-bold">{plan.title}</h1>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">{plan.status}</Badge>
                        <span className="text-sm text-muted-foreground">Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Recommendations & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {plan.recommendations.map((rec, i) => (
                                <div key={i} className="border p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">{rec.title}</h4>
                                        <Badge variant="secondary">{rec.assignedTo}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{rec.description}</p>
                                    {rec.steps && (
                                        <ul className="list-disc list-inside text-sm mt-2 pl-2">
                                            {rec.steps.map((s, si) => <li key={si}>{s}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Progress Timeline</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {plan.progressLogs?.map((log, i) => (
                                <div key={i} className="flex gap-4 border-l-2 pl-4 pb-4 last:pb-0 border-muted">
                                    <div className="text-xs text-muted-foreground min-w-[100px] pt-1">
                                        {new Date(log.at).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <p className="text-sm">{log.note}</p>
                                        {log.progressDelta && (
                                            <Badge variant={log.progressDelta.startsWith('+') ? 'default' : 'destructive'} className="mt-1 text-[10px]">
                                                Score {log.progressDelta}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!plan.progressLogs || plan.progressLogs.length === 0) && <p className="text-sm text-muted-foreground">No logs yet.</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Scoring & Actions */}
                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Impact Tracking</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Baseline: {baseline}</span>
                                    <span>Target: {target}</span>
                                </div>
                                <Progress value={Math.min(100, Math.max(0, progressPercent))} className="h-2" />
                                <div className="text-center font-bold text-lg">{current} <span className="text-sm font-normal text-muted-foreground">Current Score</span></div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div><Label className="text-xs">Baseline</Label><Input type="number" value={baseline} onChange={e => setBaseline(Number(e.target.value))}/></div>
                                <div><Label className="text-xs">Target</Label><Input type="number" value={target} onChange={e => setTarget(Number(e.target.value))}/></div>
                                <div><Label className="text-xs">Current</Label><Input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))}/></div>
                            </div>
                            <Button size="sm" className="w-full" variant="outline" onClick={handleSaveScores} disabled={updating}>
                                {updating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>} Update Scores
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-bold">Log Progress</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea placeholder="Note on progress..." value={logNote} onChange={e => setLogNote(e.target.value)} />
                            <div className="grid gap-2">
                                <Label className="text-xs">Score Change (+/-)</Label>
                                <Input type="number" value={logScoreDelta} onChange={e => setLogScoreDelta(Number(e.target.value))} />
                            </div>
                            <Button className="w-full" onClick={handleAddLog} disabled={updating || !logNote}>
                                <CheckCircle2 className="h-4 w-4 mr-2"/> Add Log Entry
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
