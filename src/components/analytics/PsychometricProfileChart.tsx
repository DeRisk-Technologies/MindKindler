// src/components/analytics/PsychometricProfileChart.tsx

import React, { useMemo } from 'react';
import { 
    ComposedChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ReferenceLine, 
    ResponsiveContainer, 
    ErrorBar,
    Cell
} from 'recharts';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions'; // Used to fetch analytics config if stored there
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { PsychometricConfig } from '@/marketplace/types';

interface ChartProps {
    data: Array<{
        name: string; // e.g., 'VCI', 'WMI'
        score: number; // Standard Score
        ciLow: number;
        ciHigh: number;
    }>;
}

export function PsychometricProfileChart({ data }: ChartProps) {
    const { user } = useAuth();
    const [config, setConfig] = useState<PsychometricConfig | null>(null);

    // Fetch Tenant-Specific Psychometric Config (Mean/SD)
    useEffect(() => {
        if (!user?.tenantId) return;
        async function fetchConfig() {
            const snap = await getDoc(doc(db, `tenants/${user?.tenantId}/settings/analytics`));
            if (snap.exists()) {
                setConfig(snap.data().psychometrics as PsychometricConfig);
            } else {
                // Fallback defaults (Standard IQ) if no pack installed
                setConfig({
                    standardScoreMean: 100,
                    standardScoreSD: 15,
                    deviationThresholds: { mild: 85, significant: 70 },
                    confidenceInterval: 95,
                    discrepancySignificance: 15
                });
            }
        }
        fetchConfig();
    }, [user?.tenantId]);

    // Prepare Error Bars Data
    // Recharts ErrorBar expects [errorLow, errorHigh] relative to the value
    const chartData = useMemo(() => {
        return data.map(d => ({
            ...d,
            // ErrorBar in Bar chart is relative to the top of the bar
            // But for psychometrics, we usually plot a point with ranges. 
            // Here we use a transparent bar + error bar trick or just a scatter composed.
            // Let's use Bar for the visual "mass" but make the ErrorBar explicitly calculate the range.
            // Recharts ErrorBar uses 'error' array [minus, plus].
            error: [d.score - d.ciLow, d.ciHigh - d.score] 
        }));
    }, [data]);

    if (!config) return <div className="h-64 flex items-center justify-center">Loading Norms...</div>;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <CardTitle>Cognitive Profile (95% CI)</CardTitle>
                        <CardDescription>
                            Standard Scores (Mean {config.standardScoreMean}, SD {config.standardScoreSD})
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 px-2 py-1 rounded">
                        <AlertCircle className="h-3 w-3" />
                        <span>Error bars indicate {config.confidenceInterval}% Confidence Interval</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip 
                            formatter={(value: any, name: any, props: any) => {
                                if (name === 'Range') return null; // Hide internal range helper
                                return [value, "Standard Score"];
                            }}
                            labelStyle={{ color: 'black', fontWeight: 'bold' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border rounded shadow-sm text-sm">
                                            <p className="font-bold">{d.name}</p>
                                            <p>Score: <span className="font-mono">{d.score}</span></p>
                                            <p className="text-muted-foreground text-xs">
                                                Range: {d.ciLow} - {d.ciHigh}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        
                        {/* Reference Lines from Config */}
                        <ReferenceLine y={config.standardScoreMean} stroke="#666" strokeDasharray="5 5" label="Mean" />
                        <ReferenceLine 
                            y={config.deviationThresholds.mild} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            label={{ value: "-1 SD", fill: "#f59e0b", position: 'insideRight' }} 
                        />
                        <ReferenceLine 
                            y={config.deviationThresholds.significant} 
                            stroke="#ef4444" 
                            label={{ value: "-2 SD", fill: "#ef4444", position: 'insideRight' }} 
                        />

                        {/* The Score Bars */}
                        <Bar dataKey="score" barSize={30} fill="#3b82f6" isAnimationActive={true}>
                            {
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.score <= config.deviationThresholds.significant ? '#ef4444' : 
                                        entry.score <= config.deviationThresholds.mild ? '#f59e0b' : '#3b82f6'
                                    } />
                                ))
                            }
                            <ErrorBar dataKey="error" width={4} strokeWidth={2} stroke="black" />
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
