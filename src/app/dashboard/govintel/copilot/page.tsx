"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";
import { generatePolicyMemo, CopilotOutput } from "@/govintel/copilot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Citations } from "@/components/ui/citations";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { GovMemo, GovAction } from "@/types/schema";

export default function PolicyCopilotPage() {
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const { data: actions } = useFirestoreCollection<GovAction>("govActions", "createdAt", "desc");
    const { toast } = useToast();
    
    // State
    const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
    const [memoType, setMemoType] = useState<"briefing"|"policy"|"safeguarding">("briefing");
    const [generating, setGenerating] = useState(false);
    const [output, setOutput] = useState<CopilotOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Action Tracker
    const [actionTitle, setActionTitle] = useState("");

    const handleGenerate = async () => {
        const snap = snapshots.find(s => s.id === selectedSnapshotId);
        if (!snap) return;

        setGenerating(true);
        try {
            const res = await generatePolicyMemo(snap, { scopeType: snap.scopeType, scopeId: snap.scopeId }, memoType);
            setOutput(res);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveMemo = async () => {
        if (!output || !selectedSnapshotId) return;
        setIsSaving(true);
        const snap = snapshots.find(s => s.id === selectedSnapshotId);
        try {
            const memo: Omit<GovMemo, 'id'> = {
                tenantId: "default",
                scopeType: snap?.scopeType || "council",
                scopeId: snap?.scopeId || "unknown",
                period: snap?.period || "unknown",
                memoType,
                contentHtml: output.html,
                citations: output.citations,
                confidence: output.confidence,
                status: "final",
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "govMemos"), memo);
            toast({ title: "Memo Saved", description: "Archived in system." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAction = async () => {
        if (!actionTitle) return;
        try {
            const action: Omit<GovAction, 'id'> = {
                title: actionTitle,
                category: "policy",
                status: "proposed",
                ownerUserId: auth.currentUser?.uid || "unknown",
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "govActions"), action);
            setActionTitle("");
            toast({ title: "Action Created" });
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-indigo-600"/> Policy Co-Pilot
                </h1>
                <p className="text-muted-foreground">Generate data-driven briefings and policy actions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Context</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Snapshot</label>
                                <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                                    <SelectTrigger><SelectValue placeholder="Select period..."/></SelectTrigger>
                                    <SelectContent>
                                        {snapshots.map(s => <SelectItem key={s.id} value={s.id}>{s.scopeType.toUpperCase()} - {s.period}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Output Type</label>
                                <Select value={memoType} onValueChange={(v:any) => setMemoType(v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="briefing">Briefing Note</SelectItem>
                                        <SelectItem value="policy">Policy Recommendation</SelectItem>
                                        <SelectItem value="safeguarding">Safeguarding Review</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" onClick={handleGenerate} disabled={generating || !selectedSnapshotId}>
                                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Generate Draft
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Action Tracker</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm border rounded px-2" 
                                    placeholder="New action item..." 
                                    value={actionTitle}
                                    onChange={e => setActionTitle(e.target.value)}
                                />
                                <Button size="sm" onClick={handleCreateAction}><CheckCircle2 className="h-4 w-4"/></Button>
                            </div>
                            <div className="space-y-2">
                                {actions.slice(0, 5).map(a => (
                                    <div key={a.id} className="text-sm border p-2 rounded flex justify-between">
                                        <span>{a.title}</span>
                                        <Badge variant="outline">{a.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Output */}
                <div className="lg:col-span-2">
                    {output ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Generated Draft</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant={output.confidence === 'high' ? 'default' : 'secondary'}>
                                            Confidence: {output.confidence.toUpperCase()}
                                        </Badge>
                                        <Button size="sm" variant="outline" onClick={handleSaveMemo} disabled={isSaving}>
                                            <Save className="mr-2 h-3 w-3"/> Save
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div 
                                        className="prose prose-sm max-w-none p-4 bg-slate-50 rounded border"
                                        dangerouslySetInnerHTML={{ __html: output.html }}
                                    />
                                </CardContent>
                            </Card>

                            <Citations citations={output.citations.map(c => ({ chunk: c, score: 1 }))} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground bg-slate-50/50">
                            <FileText className="h-12 w-12 mb-4 opacity-20"/>
                            <p>Select context and click Generate to draft a policy memo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
