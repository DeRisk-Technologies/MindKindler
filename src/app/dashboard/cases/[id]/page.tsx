"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CaseFile } from '@/types/case';
import { useStatutoryWorkflow, WorkflowState } from '@/hooks/useStatutoryWorkflow';
import { CaseHeader } from '@/components/dashboard/CaseHeader';
import { StatutoryStepper } from '@/components/dashboard/StatutoryStepper';
import { BreachCountdown } from '@/components/dashboard/BreachCountdown';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Loader2, Link as LinkIcon, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRegionalDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

// Helper to map active tools to URLs
const TOOL_LINKS: Record<string, (id: string, studentId: string) => string> = {
    'file_uploader': (id) => `/dashboard/cases/${id}/intake`,
    'clerk_agent': (id) => `/dashboard/cases/${id}/intake`,
    'observation_mode': (id) => `/dashboard/assessments/mobile`, // Placeholder
    'report_editor': (id) => `/dashboard/cases/${id}/drafting`,
    'consultation_cockpit': (id, studentId) => `/dashboard/consultations/new?studentId=${studentId}&caseId=${id}`,
    'final_signoff': (id) => `/dashboard/reports`
};

export default function CaseDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params.id as string;
    
    const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCase() {
            if (!user) return;
            
            try {
                // 1. Resolve Region & DB
                const db = await getRegionalDb(user.region || 'uk');
                
                // 2. Fetch Case Document
                const caseRef = doc(db, 'cases', id);
                const caseSnap = await getDoc(caseRef);
                
                if (!caseSnap.exists()) {
                    console.error("Case not found:", id);
                    setLoading(false);
                    return;
                }

                const data = caseSnap.data();
                
                // 3. Map Firestore Data to CaseFile Interface
                // Handle missing fields gracefully for new/intake cases
                const mappedCase: CaseFile = {
                    id: caseSnap.id,
                    tenantId: data.tenantId,
                    studentId: data.subjectId || data.studentId || 'unknown',
                    studentName: data.studentName || data.title || 'Unnamed Student', // Fallback
                    dob: data.dob || '2000-01-01', // Default if missing
                    upn: data.upn,
                    localAuthorityId: data.localAuthorityId || 'Default LA',
                    region: user.region || 'uk',
                    status: data.status || 'intake',
                    // Flags might be missing in raw Firestore docs, provide defaults
                    flags: data.flags || {
                        isNonVerbal: false,
                        requiresGuardianPresence: false,
                        hasSocialWorker: false,
                        safeguardingRisk: false
                    },
                    stakeholders: data.stakeholders || [],
                    // Statutory Timeline might need init if missing
                    statutoryTimeline: data.statutoryTimeline || {
                        requestDate: data.createdAt, // Use creation as start
                        decisionToAssessDeadline: new Date(Date.now() + 42 * 86400000).toISOString(),
                        evidenceDeadline: new Date(Date.now() + 84 * 86400000).toISOString(),
                        draftPlanDeadline: new Date(Date.now() + 112 * 86400000).toISOString(),
                        finalPlanDeadline: new Date(Date.now() + 140 * 86400000).toISOString(),
                        isOverdue: false
                    },
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    createdBy: data.createdBy
                };

                setCaseFile(mappedCase);
            } catch (e) {
                console.error("Error loading case:", e);
            } finally {
                setLoading(false);
            }
        }

        loadCase();
    }, [id, user]);

    // Initialize Hook
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
        console.log("Escalation Triggered for", caseFile.id);
        // router.push(`/dashboard/cases/${id}/safeguarding`);
    };

    const handleToolClick = (toolId: string) => {
        const linkFn = TOOL_LINKS[toolId];
        if (linkFn) {
            router.push(linkFn(caseFile.id, caseFile.studentId));
        } else {
            console.warn("No link configured for tool:", toolId);
        }
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
                                        onClick={() => handleToolClick(toolId)}
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
