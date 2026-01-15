"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CaseFile } from '../../../../types/case';
import { useStatutoryWorkflow } from '../../../../hooks/useStatutoryWorkflow';
import { CaseHeader } from '../../../../components/dashboard/CaseHeader';
import { StatutoryStepper } from '../../../../components/dashboard/StatutoryStepper';
import { BreachCountdown } from '../../../../components/dashboard/BreachCountdown';
import { Button } from '../../../../components/ui/button';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';

// --- Mock Data Service (Replace with useFirestore later) ---
async function fetchCaseById(id: string): Promise<CaseFile> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
        id: id,
        tenantId: 'tenant-123',
        studentId: 'student-456',
        studentName: 'Alex Thompson',
        dob: '2016-05-15', // 9 Years old
        upn: 'A123456789',
        localAuthorityId: 'Leeds City Council',
        region: 'uk-north',
        status: 'assessment',
        flags: {
            isNonVerbal: false,
            requiresGuardianPresence: false,
            hasSocialWorker: true,
            safeguardingRisk: false
        },
        stakeholders: [],
        statutoryTimeline: {
            requestDate: '2025-10-01', // Example date placing us in Assessment
            decisionToAssessDeadline: '2025-11-12',
            evidenceDeadline: '2025-12-24',
            draftPlanDeadline: '2026-01-21',
            finalPlanDeadline: '2026-02-18',
            isOverdue: false
        },
        createdAt: '2025-10-01',
        updatedAt: '2025-11-15',
        createdBy: 'user-1'
    };
}

export default function CaseDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCaseById(id).then(data => {
            setCaseFile(data);
            setLoading(false);
        });
    }, [id]);

    // Initialize Hook only when data is ready
    const workflow = useStatutoryWorkflow(caseFile!, undefined, false);

    if (loading || !caseFile) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 md:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    const handleEscalate = () => {
        // Navigate to Safeguarding flow
        // router.push(\`/dashboard/case/\${id}/safeguarding\`);
        console.log("Escalation Triggered");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. Case Header */}
            <CaseHeader caseFile={caseFile} onEscalate={handleEscalate} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                
                {/* 2. Top Grid: Timeline & Countdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Left: The Statutory Stepper (Span 2) */}
                    <div className="lg:col-span-2">
                        <StatutoryStepper workflow={workflow} />
                    </div>

                    {/* Right: The Breach Countdown (Span 1) */}
                    <div className="h-full">
                        <BreachCountdown workflow={workflow} />
                    </div>
                </div>

                {/* 3. Middle Grid: Active Workspace */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Active Tools Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Active Phase Tools: {workflow.currentStage.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {workflow.activeTools.map(toolId => (
                                    <Button 
                                        key={toolId} 
                                        variant="outline" 
                                        className="h-20 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-solid hover:border-blue-500 hover:bg-blue-50 transition-all"
                                    >
                                        <span className="font-semibold capitalize text-gray-700">
                                            {toolId.replace(/_/g, ' ')}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions / Gaps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md font-semibold text-gray-700">
                                Next Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {workflow.canProceed ? (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-md text-green-800 text-sm">
                                    <p className="font-semibold mb-2">Stage Complete!</p>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                        Move to Next Stage <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">
                                        To proceed to <strong>Next Stage</strong>, complete the following:
                                    </p>
                                    {/* Mock blockers for now */}
                                    <ul className="list-disc pl-5 text-sm text-amber-700">
                                        <li>Gather School Advice (Sec B)</li>
                                        <li>Complete Observation</li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
