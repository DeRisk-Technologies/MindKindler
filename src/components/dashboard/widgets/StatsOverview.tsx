// src/components/dashboard/widgets/StatsOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock, AlertCircle } from 'lucide-react';

interface StatsProps {
    stats: {
        activeCases: number;
        draftReports: number;
        upcomingDeadlines: number;
        breachRisks: number;
    };
}

export function StatsOverview({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Active Cases</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeCases}</div>
                    <p className="text-xs text-slate-400 mt-1">Currently open</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Draft Reports</CardTitle>
                    <FileText className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.draftReports}</div>
                    <p className="text-xs text-slate-400 mt-1">Pending review</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Upcoming Deadlines</CardTitle>
                    <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
                    <p className="text-xs text-slate-400 mt-1">Next 7 days</p>
                </CardContent>
            </Card>
            <Card className={stats.breachRisks > 0 ? "border-red-200 bg-red-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={stats.breachRisks > 0 ? "text-sm font-bold text-red-600" : "text-sm font-medium text-slate-500"}>Breach Risks</CardTitle>
                    <AlertCircle className={stats.breachRisks > 0 ? "h-4 w-4 text-red-600" : "h-4 w-4 text-slate-400"} />
                </CardHeader>
                <CardContent>
                    <div className={stats.breachRisks > 0 ? "text-2xl font-bold text-red-700" : "text-2xl font-bold"}>{stats.breachRisks}</div>
                    <p className={stats.breachRisks > 0 ? "text-xs text-red-600 mt-1 font-medium" : "text-xs text-slate-400 mt-1"}>Action required</p>
                </CardContent>
            </Card>
        </div>
    );
}
