import React from 'react';
import { StatutoryStageConfig, EHCP_STAGES } from '../../config/statutory-stages';
import { WorkflowState } from '../../hooks/useStatutoryWorkflow';
import { Check, Lock, Clock } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming generic utility for className merging

interface StatutoryStepperProps {
    workflow: WorkflowState;
}

export function StatutoryStepper({ workflow }: StatutoryStepperProps) {
    const { currentStage } = workflow;

    // Find index of current stage to determine past/present/future
    const currentIndex = EHCP_STAGES.findIndex(s => s.id === currentStage.id);

    return (
        <div className="w-full bg-white p-6 border rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                Statutory Timeline (20-Week Pathway)
            </h3>
            
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
                
                {/* Connecting Line (Desktop Only) */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 transform -translate-y-1/2" />

                {EHCP_STAGES.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <div key={stage.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
                            
                            {/* Circle Indicator */}
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                                isCompleted ? "bg-green-100 border-green-500 text-green-600" :
                                isActive ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110" :
                                "bg-white border-gray-300 text-gray-400"
                            )}>
                                {isCompleted && <Check className="w-5 h-5" />}
                                {isActive && <Clock className="w-5 h-5 animate-pulse" />}
                                {isFuture && <span className="text-sm font-medium">{index + 1}</span>}
                            </div>

                            {/* Label & Weeks */}
                            <div className={cn(
                                "flex flex-col md:items-center text-left md:text-center min-w-[120px]",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                <span className={cn(
                                    "text-sm font-bold",
                                    isActive ? "text-blue-700" : "text-gray-700"
                                )}>
                                    {stage.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Week {stage.weekStart} - {stage.weekEnd}
                                </span>
                            </div>

                            {/* Mobile Connecting Line (Vertical) - Handled by flex layout gap normally, or custom border */}
                        </div>
                    );
                })}
            </div>

            {/* Current Stage Context (Visible only for active stage) */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h4 className="font-semibold text-blue-900">Current Phase: {currentStage.label}</h4>
                    <p className="text-sm text-blue-700">{currentStage.description}</p>
                </div>
                <div className="text-right text-xs text-blue-600">
                    Exit Criteria: <span className="font-medium">{currentStage.exitCriteria}</span>
                </div>
            </div>
        </div>
    );
}
