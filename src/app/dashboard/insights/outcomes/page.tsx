"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { InterventionPlan, RecommendationTemplate } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateOutcomeStats, getTopInterventions } from "@/analytics/interventions";
import { Loader2, TrendingUp, CheckCircle, Activity, BarChart3, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function OutcomesDashboard() {
    const { data: plans, loading } = useFirestoreCollection<InterventionPlan>("interventionPlans");
    const { toast } = useToast();

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const stats = calculateOutcomeStats(plans);
    const topInterventions = getTopInterventions(plans);

    // Chart Data
    const pieData = [
        { name: 'Improving', value: stats.improvingCount, color: '#22c55e' },
        { name: 'Stable', value: stats.stableCount, color: '#f59e0b' },
        { name: 'Worsening', value: stats.worseningCount, color: '#ef4444' },
    ];

    const handleExport = () => {
        toast({ title: "Report Exported", description: "Outcome report generated (Mock PDF)." });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Intervention Outcomes</h1>
                    <p className="text-muted-foreground">Impact analysis and success metrics.</p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4"/> Export Report
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Active Plans</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">{stats.activePlans}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Success Rate</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-green-600">
                        {stats.totalPlans > 0 ? ((stats.improvingCount / stats.totalPlans) * 100).toFixed(0) : 0}%
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Avg Score Gain</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-600">
                        +{stats.avgScoreGain.toFixed(1)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">
                        {stats.completionRate.toFixed(0)}%
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Outcome Distribution</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 text-sm mt-4">
                            {pieData.map(d => (
                                <div key={d.name} className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}} /> {d.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Top Interventions by Impact</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topInterventions.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <div className="font-medium">{item.title}</div>
                                        <div className="text-xs text-muted-foreground">Used in {item.usageCount} plans</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">+{item.avgScoreDelta.toFixed(1)}</div>
                                        <div className="text-xs text-muted-foreground">Avg Gain</div>
                                    </div>
                                </div>
                            ))}
                            {topInterventions.length === 0 && <p className="text-muted-foreground text-sm">No data yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
