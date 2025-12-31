"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";
import { DEFAULT_ASSUMPTIONS, runSimulation, PlannerOutputs } from "@/govintel/planner/model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calculator, TrendingUp, Users, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlannerBaselinePage() {
    const { data: snapshots } = useFirestoreCollection<GovSnapshot>("govSnapshots", "createdAt", "desc");
    const router = useRouter();
    
    // State
    const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
    const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
    const [results, setResults] = useState<PlannerOutputs | null>(null);

    const handleCompute = () => {
        const snap = snapshots.find(s => s.id === selectedSnapshotId);
        if (!snap) return;
        
        const res = runSimulation(snap, assumptions, { referralIncreasePercent: 0, staffingIncreaseEpps: 0 });
        setResults(res);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Capacity & Budget Planner</h1>
                    <p className="text-muted-foreground">Model staffing needs and forecast budgets based on operational data.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard/govintel/planner/scenarios')}>
                    Scenario Modeling
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration */}
                <Card className="h-fit">
                    <CardHeader><CardTitle>Baseline Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Source Data</Label>
                            <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                                <SelectTrigger><SelectValue placeholder="Select period..."/></SelectTrigger>
                                <SelectContent>
                                    {snapshots.map(s => <SelectItem key={s.id} value={s.id}>{s.scopeType.toUpperCase()} - {s.period}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Avg Hours / Assessment</Label>
                            <Input type="number" value={assumptions.avgHoursPerAssessment} onChange={e => setAssumptions({...assumptions, avgHoursPerAssessment: Number(e.target.value)})}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Avg Hours / Intervention</Label>
                            <Input type="number" value={assumptions.avgHoursPerInterventionPlan} onChange={e => setAssumptions({...assumptions, avgHoursPerInterventionPlan: Number(e.target.value)})}/>
                        </div>
                        <div className="space-y-2">
                            <Label>EPP Monthly Salary</Label>
                            <Input type="number" value={assumptions.salaryMonthlyEpp} onChange={e => setAssumptions({...assumptions, salaryMonthlyEpp: Number(e.target.value)})}/>
                        </div>
                        <Button className="w-full" onClick={handleCompute} disabled={!selectedSnapshotId}>
                            <Calculator className="mr-2 h-4 w-4"/> Compute Baseline
                        </Button>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Required Staffing</CardTitle>
                                        <Users className="h-4 w-4 text-blue-600"/>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{results.requiredEpps} EPPs</div>
                                        <p className="text-xs text-muted-foreground">To meet current demand</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Annual Budget Est.</CardTitle>
                                        <DollarSign className="h-4 w-4 text-green-600"/>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${results.totalBudgetAnnual.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">Includes 25% overhead</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Capacity Gap</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-orange-600"/>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${results.capacityGap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {results.capacityGap.toFixed(0)} Hours
                                        </div>
                                        <p className="text-xs text-muted-foreground">{results.capacityGap < 0 ? "Shortfall" : "Surplus"}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Backlog Clearance</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-purple-600"/>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {results.backlogClearanceMonths > 120 ? "> 10 Years" : `${results.backlogClearanceMonths.toFixed(1)} Months`}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Time to clear pending tasks</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground bg-slate-50">
                            <Calculator className="h-12 w-12 mb-4 opacity-20"/>
                            <p>Select a snapshot and click Compute to see projections.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
