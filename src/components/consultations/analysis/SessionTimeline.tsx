// src/components/consultations/analysis/SessionTimeline.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimelineEvent {
    timestamp: Date;
    type: 'observation' | 'insight' | 'speech';
    label: string;
    speaker?: string;
    intensity?: number; // 1-5 for observation
}

interface SessionTimelineProps {
    events: TimelineEvent[];
    durationMs: number;
}

export function SessionTimeline({ events, durationMs }: SessionTimelineProps) {
    if (!events.length || durationMs === 0) return null;

    const startTime = events[0].timestamp.getTime();

    const getPosition = (time: Date) => {
        const offset = time.getTime() - startTime;
        return (offset / durationMs) * 100;
    };

    return (
        <Card className="mb-6 border-slate-200 shadow-sm">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Session Timeline Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative h-16 w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                    {/* Time Markers */}
                    <div className="absolute inset-0 flex justify-between px-2 text-[10px] text-slate-300 pointer-events-none mt-1">
                        <span>00:00</span>
                        <span>End</span>
                    </div>

                    {/* Events */}
                    <TooltipProvider>
                        {events.map((ev, i) => {
                            const pos = getPosition(ev.timestamp);
                            if (pos < 0 || pos > 100) return null;

                            let color = "bg-slate-400";
                            if (ev.type === 'insight') color = "bg-purple-500";
                            if (ev.type === 'observation') color = "bg-amber-500";
                            
                            return (
                                <Tooltip key={i}>
                                    <TooltipTrigger asChild>
                                        <div 
                                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color} border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform`}
                                            style={{ left: `${pos}%` }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs font-bold">{ev.label}</p>
                                        <p className="text-[10px] text-slate-400">{ev.timestamp.toLocaleTimeString()}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
                
                <div className="flex gap-4 mt-2 justify-center">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-purple-500" /> AI Insights
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-amber-500" /> Observations
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
