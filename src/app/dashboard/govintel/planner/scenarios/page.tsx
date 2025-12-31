"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";
import { DEFAULT_ASSUMPTIONS, runSimulation, PlannerOutputs, PlanningScenario } from "@/govintel/planner/model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Plus } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ScenarioModelingPage() {
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const { data: savedScenarios } = useFirestoreCollection<PlanningScenario>("planningScenarios", "createdAt", "desc");
    const { toast } = useToast();

    // State
    const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
    const [referralIncrease, setReferralIncrease] = useState(0);
    const [staffingIncrease, setStaffingIncrease] = useState(0);
    const [scenarioName, setScenarioName] = useState("");
    const [result, setResult] = useState<PlannerOutputs | null>(null);

    const handleSimulate = () => {
        const snap = snapshots.find(s => s.id === selectedSnapshotId);
        if (!snap) return;

        const res = runSimulation(snap, DEFAULT_ASSUMPTIONS, { 
            referralIncreasePercent: referralIncrease, 
            staffingIncreaseEpps: staffingIncrease 
        });
        setResult(res);
    };

    const handleSave = async () => {
        if (!scenarioName || !result) return;
        try {
            const scenario: PlanningScenario = {
                tenantId: "default",
                name: scenarioName,
                baseSnapshotRef: selectedSnapshotId,
                modifiers: {
                    referralIncreasePercent: referralIncrease,
                    staffingIncreaseEpps: staffingIncrease
                },
                computedOutputs: result,
                status: 'saved',
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "planningScenarios"), scenario);
            toast({ title: "Scenario Saved", description: "Added to comparison list." });
            setScenarioName("");
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Scenario Modeling</h1>
                <p className="text-muted-foreground">Simulate "What-If" scenarios for growth and resource allocation.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <Card>
                    <CardHeader><CardTitle>Scenario Inputs</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Base Data</Label>
                            <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                                <SelectTrigger><SelectValue placeholder="Select period..."/></SelectTrigger>
                                <SelectContent>
                                    {snapshots.map(s => <SelectItem key={s.id} value={s.id}>{s.scopeType.toUpperCase()} - {s.period}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Referral Growth</Label>
                                <span className="text-sm font-bold">+{referralIncrease}%</span>
                            </div>
                            <Slider value={[referralIncrease]} onValueChange={([v]) => setReferralIncrease(v)} max={100} step={5} />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>New EPP Hires</Label>
                                <span className="text-sm font-bold">+{staffingIncrease}</span>
                            </div>
                            <Slider value={[staffingIncrease]} onValueChange={([v]) => setStaffingIncrease(v)} max={20} step={1} />
                        </div>

                        <Button className="w-full" onClick={handleSimulate} disabled={!selectedSnapshotId}>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin hidden"/> Run Simulation
                        </Button>
                    </CardContent>
                </Card>

                {/* Live Result */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Projected Impact</CardTitle>
                        {result && (
                            <div className="flex gap-2">
                                <Input className="w-40 h-8" placeholder="Scenario Name" value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
                                <Button size="sm" onClick={handleSave} disabled={!scenarioName}><Save className="h-4 w-4 mr-2"/> Save</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 bg-slate-50 rounded border">
                                    <div className="text-sm text-muted-foreground">Required EPPs</div>
                                    <div className="text-2xl font-bold">{result.requiredEpps}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border">
                                    <div className="text-sm text-muted-foreground">Budget Est.</div>
                                    <div className="text-2xl font-bold text-green-600">${result.totalBudgetAnnual.toLocaleString()}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border">
                                    <div className="text-sm text-muted-foreground">Capacity Gap</div>
                                    <div className={`text-2xl font-bold ${result.capacityGap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {result.capacityGap.toFixed(0)} Hours
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">Run simulation to see results.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Saved Scenarios Table */}
                <Card className="col-span-full">
                    <CardHeader><CardTitle>Scenario Comparisons</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Scenario Name</TableHead>
                                    <TableHead>Growth</TableHead>
                                    <TableHead>Hires</TableHead>
                                    <TableHead>Req. EPPs</TableHead>
                                    <TableHead>Budget</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedScenarios.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell>+{s.modifiers.referralIncreasePercent}%</TableCell>
                                        <TableCell>+{s.modifiers.staffingIncreaseEpps}</TableCell>
                                        <TableCell>{s.computedOutputs?.requiredEpps}</TableCell>
                                        <TableCell>${s.computedOutputs?.totalBudgetAnnual.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
