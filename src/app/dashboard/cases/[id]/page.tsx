"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CaseFile } from '@/types/case';
import { useStatutoryWorkflow } from '@/hooks/useStatutoryWorkflow';
import { CaseHeader } from '@/components/dashboard/CaseHeader';
import { getRegionalDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Tabs Components
import { CaseOverview } from '@/components/dashboard/case/tabs/case-overview';
import { CaseFiles } from '@/components/dashboard/case/tabs/case-files';
import { CaseSchedule } from '@/components/dashboard/case/tabs/case-schedule';
import { CaseEvidence } from '@/components/dashboard/case/tabs/case-evidence';
import { ReportGenerator } from '@/components/dashboard/report-generator';

export default function CaseDashboardPage() {
    const params = useParams();
    const { user } = useAuth();
    const id = params.id as string;
    
    const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCase() {
            if (!user) return;
            try {
                const db = await getRegionalDb(user.region || 'uk');
                const caseRef = doc(db, 'cases', id);
                const caseSnap = await getDoc(caseRef);
                
                if (caseSnap.exists()) {
                    setCaseFile({ id: caseSnap.id, ...caseSnap.data() } as CaseFile);
                }
            } catch (e) {
                console.error("Error loading case:", e);
            } finally {
                setLoading(false);
            }
        }
        loadCase();
    }, [id, user]);

    // Use Workflow Hook (Handles Dual Track: LA vs EPP)
    const workflow = useStatutoryWorkflow(caseFile!, undefined, false);

    if (loading || !caseFile) {
        return <div className="p-8"><Skeleton className="h-48 w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. Header (Context: Client & Deadline) */}
            <CaseHeader caseFile={caseFile} onEscalate={() => {}} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                
                {/* 2. The Workbench Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-12">
                        <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 px-6">
                            The Brief
                        </TabsTrigger>
                        <TabsTrigger value="files" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 px-6">
                            Case File (Forensic)
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 px-6">
                            Work Schedule
                        </TabsTrigger>
                        <TabsTrigger value="evidence" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 px-6">
                            Evidence Lab
                        </TabsTrigger>
                        <TabsTrigger value="reporting" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 px-6">
                            Reporting
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="overview">
                            <CaseOverview caseFile={caseFile} workflow={workflow} />
                        </TabsContent>
                        
                        <TabsContent value="files">
                            <CaseFiles caseId={caseFile.id} />
                        </TabsContent>

                        <TabsContent value="schedule">
                            <CaseSchedule caseFile={caseFile} />
                        </TabsContent>

                        <TabsContent value="evidence">
                            <CaseEvidence caseId={caseFile.id} studentId={caseFile.studentId} />
                        </TabsContent>

                        <TabsContent value="reporting">
                            <ReportGenerator />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
