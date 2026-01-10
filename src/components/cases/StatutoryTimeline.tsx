// src/components/cases/StatutoryTimeline.tsx
"use client";

import React from 'react';
import { differenceInWeeks } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatutoryTimelineProps {
    startDate: string; // ISO String
    currentStage: string; // 'evidence', 'drafting', 'consultation'
}

const STAGES = [
    { id: 'evidence', label: 'Evidence Gathering', startWeek: 0, endWeek: 6, color: 'bg-blue-500' },
    { id: 'drafting', label: 'Drafting & Moderation', startWeek: 6, endWeek: 16, color: 'bg-purple-500' },
    { id: 'consultation', label: 'Consultation', startWeek: 16, endWeek: 20, color: 'bg-emerald-500' }
];

export function StatutoryTimeline({ startDate, currentStage }: StatutoryTimelineProps) {
    const today = new Date();
    const start = new Date(startDate);
    const weeksElapsed = Math.max(0, differenceInWeeks(today, start));
    
    // Determine status
    const currentStageDef = STAGES.find(s => s.id === currentStage);
    const isOverdue = currentStageDef ? weeksElapsed > currentStageDef.endWeek : false;
    
    // Calculate marker position (capped at 20 weeks)
    const markerPosition = Math.min((weeksElapsed / 20) * 100, 100);

    return (
        <Card className="border shadow-sm">
            <CardHeader className="py-3 pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        Statutory Timeline (20-Week Clock)
                    </CardTitle>
                    {isOverdue && (
                        <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3" /> BREACH RISK
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative h-12 w-full mt-4 mb-6">
                    {/* Track Background */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        {STAGES.map((stage) => {
                            const width = ((stage.endWeek - stage.startWeek) / 20) * 100;
                            return (
                                <div 
                                    key={stage.id} 
                                    style={{ width: `${width}%` }} 
                                    className={`h-full border-r border-white last:border-0 ${stage.color} opacity-20`}
                                />
                            );
                        })}
                    </div>

                    {/* Progress Marker */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div 
                                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 transition-all duration-500 ${isOverdue ? 'bg-red-500' : 'bg-slate-800'}`}
                                    style={{ left: `${markerPosition}%` }}
                                >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                        Week {weeksElapsed}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Current Status: Week {weeksElapsed}</p>
                                <p>Deadline: Week 20</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Labels */}
                    <div className="absolute -bottom-6 w-full flex text-[10px] text-slate-400 font-medium justify-between px-1">
                        <span>Start</span>
                        <span className="ml-[25%]">Week 6 (Advice)</span>
                        <span className="ml-[25%]">Week 16 (Draft)</span>
                        <span>Week 20 (Final)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
