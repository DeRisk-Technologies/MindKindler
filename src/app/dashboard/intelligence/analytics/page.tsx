"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { GuardianFinding } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, ShieldCheck, AlertTriangle, Activity } from "lucide-react";

export default function ComplianceAnalyticsPage() {
    const { data: findings, loading } = useFirestoreCollection<GuardianFinding>("guardianFindings", "createdAt", "desc");

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    // Aggregations
    const severityCount = {
        info: findings.filter(f => f.severity === 'info').length,
        warning: findings.filter(f => f.severity === 'warning').length,
        critical: findings.filter(f => f.severity === 'critical').length,
    };

    const statusCount = {
        open: findings.filter(f => f.status === 'open').length,
        resolved: findings.filter(f => f.status === 'resolved').length,
        overridden: findings.filter(f => f.status === 'overridden').length,
    };

    const chartData = [
        { name: 'Info', count: severityCount.info },
        { name: 'Warning', count: severityCount.warning },
        { name: 'Critical', count: severityCount.critical },
    ];

    const pieData = [
        { name: 'Open', value: statusCount.open, color: '#ef4444' },
        { name: 'Resolved', value: statusCount.resolved, color: '#22c55e' },
        { name: 'Overridden', value: statusCount.overridden, color: '#f59e0b' },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Compliance Analytics</h1>
                <p className="text-muted-foreground">Insights into compliance health, blocking actions, and override requests.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{findings.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{severityCount.critical}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overrides Granted</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-orange-500">{statusCount.overridden}</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Findings by Severity</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Resolution Status</CardTitle></CardHeader>
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
            </div>
        </div>
    );
}
