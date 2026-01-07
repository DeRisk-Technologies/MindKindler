// src/components/analytics/LongitudinalProgressChart.tsx

import React from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ReferenceLine, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressPoint {
    date: string; // ISO date
    score: number; // Standard Score
    domain: string; // e.g. "VCI"
}

interface InterventionMarker {
    date: string;
    label: string;
}

interface Props {
    data: ProgressPoint[];
    interventions?: InterventionMarker[];
    goalScore?: number;
}

export function LongitudinalProgressChart({ data, interventions, goalScore = 100 }: Props) {
    
    // Group data by domain if we want multi-line, but simple version assumes one domain or filtered
    // For V1, let's assume we are plotting one primary domain or sorting by date.
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Progress Trajectory
                        </CardTitle>
                        <CardDescription>Longitudinal tracking against interventions.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => format(new Date(str), 'MMM yy')}
                            className="text-xs"
                        />
                        <YAxis domain={[60, 140]} />
                        <Tooltip 
                            labelFormatter={(label) => format(new Date(label), 'PPP')}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />

                        {/* Goal Line */}
                        <ReferenceLine 
                            y={goalScore} 
                            stroke="#10b981" 
                            strokeDasharray="5 5" 
                            label={{ value: "Target", fill: "#10b981", position: 'insideRight' }} 
                        />

                        {/* Intervention Markers (Vertical Lines) */}
                        {interventions?.map((iv, idx) => (
                            <ReferenceLine 
                                key={idx} 
                                x={iv.date} 
                                stroke="#8b5cf6" 
                                label={{ 
                                    value: iv.label, 
                                    fill: "#8b5cf6", 
                                    position: 'top', 
                                    fontSize: 10 
                                }} 
                            />
                        ))}

                        {/* The Data Line */}
                        <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#2563eb" 
                            strokeWidth={3} 
                            activeDot={{ r: 6 }} 
                            name="Standard Score"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
