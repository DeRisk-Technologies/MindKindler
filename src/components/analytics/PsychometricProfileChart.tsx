// src/components/analytics/PsychometricProfileChart.tsx

import React, { useMemo, useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PsychometricConfig } from '@/marketplace/types';
import { Badge } from '@/components/ui/badge';

interface ChartProps {
    data: Array<{
        name: string; // e.g., 'VCI', 'GCA'
        score: number;
        ciLow?: number;
        ciHigh?: number;
    }>;
}

export function PsychometricProfileChart({ data }: ChartProps) {
    const { user } = useAuth();
    const [config, setConfig] = useState<PsychometricConfig | null>(null);
    const [testType, setTestType] = useState<'Standard (WISC)' | 'BAS3 (T-Score)'>('Standard (WISC)');

    // 1. Auto-Detect Test Type from Data Labels
    useEffect(() => {
        if (!data || data.length === 0) return;
        
        const names = data.map(d => d.name);
        const isBAS = names.some(n => ['GCA', 'SNC', 'Matrices', 'Similarities'].includes(n));
        
        if (isBAS) {
            setTestType('BAS3 (T-Score)');
            setConfig({
                standardScoreMean: 50,
                standardScoreSD: 10,
                deviationThresholds: { mild: 40, significant: 30 },
                confidenceInterval: 90,
                discrepancySignificance: 7 // Adjusted for T-Score
            });
        } else {
            setTestType('Standard (WISC)');
            // Default WISC, will be overridden by tenant config if fetch succeeds
            setConfig({
                standardScoreMean: 100,
                standardScoreSD: 15,
                deviationThresholds: { mild: 85, significant: 70 },
                confidenceInterval: 95,
                discrepancySignificance: 15
            });
        }
    }, [data]);

    // 2. Fetch Tenant Override (Optional)
    useEffect(() => {
        if (!user?.tenantId) return;
        async function fetchConfig() {
            // Only fetch if we haven't locked into BAS mode, or if tenant has global override
            // For now, let auto-detection rule unless specific config exists
            try {
                const snap = await getDoc(doc(db, `tenants/${user?.tenantId}/settings/analytics`));
                if (snap.exists()) {
                    // Merge if tenant has custom thresholds
                    const tenantConfig = snap.data().psychometrics;
                    if (tenantConfig) setConfig(prev => ({ ...prev, ...tenantConfig }));
                }
            } catch (e) {
                // Ignore
            }
        }
        fetchConfig();
    }, [user?.tenantId]);

    // 3. Prepare Chart Data (Handle Missing CIs)
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map(d => {
            // Default CI to +/- 5 points if missing (Standard Error of Measurement estimate)
            const ciLow = d.ciLow ?? (d.score - 5);
            const ciHigh = d.ciHigh ?? (d.score + 5);
            
            return {
                ...d,
                ciLow,
                ciHigh,
                // Error Bar requires [minus, plus] relative to score
                error: [d.score - ciLow, ciHigh - d.score] 
            };
        });
    }, [data]);

    if (!config) return <div className="h-64 flex items-center justify-center"><Activity className="animate-spin text-slate-300"/></div>;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Cognitive Profile
                            <Badge variant="secondary" className="text-xs font-normal">{testType}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {testType === 'BAS3 (T-Score)' ? 'T-Scores (Mean 50, SD 10)' : 'Standard Scores (Mean 100, SD 15)'}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 px-2 py-1 rounded">
                        <AlertCircle className="h-3 w-3" />
                        <span>{config.confidenceInterval}% Confidence Interval</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
                                            <p className="font-bold mb-1">{d.name}</p>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-slate-500">Score:</span>
                                                <span className="font-mono font-bold">{d.score}</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-xs text-muted-foreground mt-1 pt-1 border-t">
                                                <span>Range ({config.confidenceInterval}%):</span>
                                                <span>{d.ciLow} - {d.ciHigh}</span>
                                            </div>
                                            {/* Interpretive Label */}
                                            <div className="mt-2 text-xs font-medium text-center px-2 py-1 rounded bg-slate-100">
                                                {d.score <= config.deviationThresholds.significant ? "Significantly Below Average" :
                                                 d.score <= config.deviationThresholds.mild ? "Below Average" :
                                                 d.score >= (config.standardScoreMean + config.standardScoreSD) ? "Above Average" : "Average"}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        
                        {/* Reference Lines */}
                        <ReferenceLine y={config.standardScoreMean} stroke="#64748b" strokeDasharray="5 5" label={{ value: "Mean", fill: "#64748b", fontSize: 10 }} />
                        
                        {/* -1 SD Line */}
                        <ReferenceLine 
                            y={config.deviationThresholds.mild} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            label={{ value: "-1 SD", fill: "#f59e0b", position: 'insideRight', fontSize: 10 }} 
                        />
                        
                        {/* -2 SD Line */}
                        <ReferenceLine 
                            y={config.deviationThresholds.significant} 
                            stroke="#ef4444" 
                            label={{ value: "-2 SD", fill: "#ef4444", position: 'insideRight', fontSize: 10 }} 
                        />

                        {/* The Score Bars */}
                        <Bar dataKey="score" barSize={40} isAnimationActive={true}>
                            {
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.score <= config.deviationThresholds.significant ? '#ef4444' : // Red
                                        entry.score <= config.deviationThresholds.mild ? '#f59e0b' : // Amber
                                        entry.score >= (config.standardScoreMean + config.standardScoreSD) ? '#10b981' : // Green (High)
                                        '#3b82f6' // Blue (Avg)
                                    } />
                                ))
                            }
                            <ErrorBar dataKey="error" width={4} strokeWidth={2} stroke="#1e293b" />
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
