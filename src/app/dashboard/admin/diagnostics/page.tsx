// src/app/dashboard/admin/diagnostics/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, HardDrive, BrainCircuit, Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

// App Versions
import pkg from '../../../../../package.json';
import ukPack from '@/marketplace/catalog/uk_la_pack.json';

interface HealthReport {
    status: 'healthy' | 'degraded';
    timestamp: string;
    region: string;
    checks: {
        ai: { status: 'ok' | 'failed', latencyMs?: number, error?: string };
        db: { status: 'ok' | 'failed', latencyMs?: number, error?: string };
        storage: { status: 'ok' | 'failed', latencyMs?: number, error?: string };
    };
}

export default function DiagnosticsPage() {
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState(false);
    const [report, setReport] = useState<HealthReport | null>(null);

    const runDiagnostics = async () => {
        setIsRunning(true);
        setReport(null);
        try {
            const checkFn = httpsCallable(functions, 'checkSystemHealth');
            const result = await checkFn();
            setReport(result.data as HealthReport);
            toast({ title: "Diagnostics Complete", description: "System health report generated." });
        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Diagnostic Failed", description: e.message });
        } finally {
            setIsRunning(false);
        }
    };

    const StatusIcon = ({ status }: { status?: string }) => {
        if (!status) return <div className="h-5 w-5 bg-slate-200 rounded-full animate-pulse" />;
        if (status === 'ok') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Diagnostics</h1>
                    <p className="text-muted-foreground">Real-time infrastructure health check.</p>
                </div>
                <Button onClick={runDiagnostics} disabled={isRunning} size="lg">
                    {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                    Run Diagnostics
                </Button>
            </div>

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">App Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">v{pkg.version}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">UK Compliance Pack</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">v{ukPack.version}</div>
                        <p className="text-xs text-muted-foreground">Release: {ukPack.releaseDate}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* AI */}
                <Card className={report?.checks.ai.status === 'failed' ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-indigo-500" /> AI Engine
                        </CardTitle>
                        <StatusIcon status={report?.checks.ai.status} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Heartbeat:</span>
                                <span>{report ? (report.checks.ai.latencyMs ? `${report.checks.ai.latencyMs}ms` : 'Failed') : '—'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Model:</span>
                                <span>Gemini 1.5 Flash</span>
                            </div>
                            {report?.checks.ai.error && (
                                <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                                    {report.checks.ai.error}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Database */}
                <Card className={report?.checks.db.status === 'failed' ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" /> Firestore
                        </CardTitle>
                        <StatusIcon status={report?.checks.db.status} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Write Latency:</span>
                                <span>{report ? (report.checks.db.latencyMs ? `${report.checks.db.latencyMs}ms` : 'Failed') : '—'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Region:</span>
                                <span>{report?.region || '—'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage */}
                <Card className={report?.checks.storage.status === 'failed' ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-amber-500" /> Storage
                        </CardTitle>
                        <StatusIcon status={report?.checks.storage.status} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Bucket Access:</span>
                                <span>{report ? (report.checks.storage.status === 'ok' ? 'Verified' : 'Denied') : '—'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Latency:</span>
                                <span>{report ? (report.checks.storage.latencyMs ? `${report.checks.storage.latencyMs}ms` : 'Failed') : '—'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {report && (
                <div className="text-center text-xs text-muted-foreground">
                    Diagnostic Run ID: {new Date(report.timestamp).getTime()} • Server Time: {new Date(report.timestamp).toLocaleString()}
                </div>
            )}
        </div>
    );
}
