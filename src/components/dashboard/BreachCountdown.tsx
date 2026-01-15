import React from 'react';
import { RAGStatus, WorkflowState } from '../../hooks/useStatutoryWorkflow';
import { CalendarClock, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';

interface BreachCountdownProps {
    workflow: WorkflowState;
}

export function BreachCountdown({ workflow }: BreachCountdownProps) {
    const { 
        daysRemainingInStage, 
        ragStatus, 
        currentStage, 
        isBreachRisk,
        daysUntilFinalDeadline 
    } = workflow;

    // Visual Styles based on RAG
    const styles = {
        red: "bg-red-50 border-red-200 text-red-900 animate-pulse-slow",
        amber: "bg-amber-50 border-amber-200 text-amber-900",
        green: "bg-emerald-50 border-emerald-200 text-emerald-900"
    };
    
    const iconStyles = {
        red: "text-red-600",
        amber: "text-amber-600",
        green: "text-emerald-600"
    };

    const StatusIcon = ragStatus === 'red' ? AlertCircle : (ragStatus === 'amber' ? AlertTriangle : CalendarClock);

    return (
        <Card className="h-full shadow-sm overflow-hidden">
             {/* Header Section */}
             <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                 <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Statutory Clock</span>
                 <span className="text-xs font-mono text-gray-400">Week 20 Target: {daysUntilFinalDeadline}d</span>
             </div>

            {/* Main Countdown Body */}
            <div className={cn(
                "p-6 flex flex-col items-center justify-center text-center h-[calc(100%-40px)] transition-colors duration-500",
                styles[ragStatus]
            )}>
                
                <StatusIcon className={cn("w-10 h-10 mb-3", iconStyles[ragStatus])} />
                
                {isBreachRisk ? (
                    <>
                        <h2 className="text-3xl font-bold tracking-tighter text-red-700">
                            BREACH
                        </h2>
                        <p className="text-sm font-medium mt-1">
                            Deadline Passed for {currentStage.label}
                        </p>
                    </>
                ) : (
                    <>
                         <div className="flex items-baseline gap-1">
                            <h2 className="text-5xl font-extrabold tracking-tighter">
                                {daysRemainingInStage}
                            </h2>
                            <span className="text-lg font-medium opacity-80">days</span>
                        </div>
                        <p className="text-sm font-medium mt-2 opacity-90">
                            Remaining in {currentStage.label}
                        </p>
                    </>
                )}

                {ragStatus === 'red' && !isBreachRisk && (
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-red-600 bg-red-100 px-3 py-1 rounded-full">
                        Urgent Attention
                    </p>
                )}
                 {ragStatus === 'amber' && (
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                        Approaching Deadline
                    </p>
                )}
                 {ragStatus === 'green' && (
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                        On Track
                    </p>
                )}
            </div>
        </Card>
    );
}
