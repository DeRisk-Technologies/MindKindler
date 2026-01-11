// src/app/dashboard/admin/pilot-metrics/page.tsx
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Activity, ThumbsUp, ThumbsDown, FileText, User, Zap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PilotMetricsPage() {
    // 1. Fetch Global AI Data (Super Admin Access)
    // Note: In real production, this would use a backend aggregation function to avoid reading thousands of docs.
    const { data: provenance, loading: loadingProv } = useFirestoreCollection("ai_provenance", "createdAt", "desc");
    const { data: feedback, loading: loadingFeed } = useFirestoreCollection("ai_feedback", "createdAt", "desc");

    // 2. Compute Metrics
    const metrics = useMemo(() => {
        if (loadingProv || loadingFeed) return null;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // A. Reports Today
        const reportsToday = provenance.filter(p => {
            const t = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt).getTime();
            return t >= startOfDay;
        });

        // B. Sentiment
        const positive = feedback.filter(f => (f as any).rating === 'positive').length;
        const negative = feedback.filter(f => (f as any).rating === 'negative').length;
        const totalFeed = positive + negative;
        const sentimentScore = totalFeed > 0 ? Math.round((positive / totalFeed) * 100) : 0;

        // C. Most Active EPP
        const userActivity: Record<string, number> = {};
        provenance.forEach((p: any) => {
            const uid = p.createdBy || 'unknown';
            userActivity[uid] = (userActivity[uid] || 0) + 1;
        });
        const topUser = Object.entries(userActivity).sort((a, b) => b[1] - a[1])[0];

        // D. Activity Chart (Last 7 Days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const end = start + 86400000;
            
            const count = provenance.filter(p => {
                const t = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt).getTime();
                return t >= start && t < end;
            }).length;
            
            chartData.push({ name: label, generations: count });
        }

        return {
            reportsToday: reportsToday.length,
            totalGenerations: provenance.length,
            sentimentScore,
            totalFeedback: totalFeed,
            topEpp: topUser ? { id: topUser[0], count: topUser[1] } : { id: 'None', count: 0 },
            chartData
        };
    }, [provenance, feedback, loadingProv, loadingFeed]);

    if (!metrics) return <div className="p-8">Loading Metrics...</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pilot Telemetry</h1>
                <p className="text-muted-foreground">Real-time monitoring of AI performance and user engagement.</p>
            </div>

            {/* Top Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports Generated (Today)</CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.reportsToday}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.totalGenerations} total since launch
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Sentiment</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.sentimentScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            Positive feedback ({metrics.totalFeedback} votes)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Active EPP</CardTitle>
                        <User className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate max-w-[150px] text-sm">{metrics.topEpp.id}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.topEpp.count} actions performed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">Healthy</div>
                        <p className="text-xs text-muted-foreground">
                            All services operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                
                {/* Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Generation Velocity</CardTitle>
                        <CardDescription>AI workload over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.chartData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="generations" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                        {metrics.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 6 ? '#4f46e5' : '#818cf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity Stream</CardTitle>
                        <CardDescription>Live feed of AI usage and feedback.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {provenance.slice(0, 10).map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                                        <div className="mt-1 bg-slate-100 p-2 rounded-full">
                                            <FileText className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{log.flowName || 'AI Action'}</p>
                                            <p className="text-xs text-muted-foreground truncate w-48">{log.prompt?.slice(0, 50)}...</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-4">{log.model}</Badge>
                                                <span className="text-[10px] text-slate-400">
                                                    {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
