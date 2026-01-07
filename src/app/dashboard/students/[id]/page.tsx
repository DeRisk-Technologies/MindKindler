// src/app/dashboard/students/[id]/page.tsx

"use client";

import React, { useState, use } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { PsychometricProfileChart } from '@/components/analytics/PsychometricProfileChart';
import { SmartInterventionMapper } from '@/components/interventions/SmartInterventionMapper';
import { LongitudinalProgressChart } from '@/components/analytics/LongitudinalProgressChart';
import { Student360Main } from '@/components/student360/Student360Main';
import { Shield } from 'lucide-react';

// Mock Data for Assessment/Progress (Demo Purposes)
const MOCK_SCORES = [
    { name: 'VCI', score: 82, ciLow: 77, ciHigh: 87 },
    { name: 'VSI', score: 95, ciLow: 90, ciHigh: 100 },
    { name: 'FRI', score: 74, ciLow: 69, ciHigh: 79 }, 
    { name: 'WMI', score: 88, ciLow: 83, ciHigh: 93 },
    { name: 'PSI', score: 92, ciLow: 87, ciHigh: 97 },
];

const MOCK_PROGRESS = [
    { date: '2023-09-01', score: 70, domain: 'Reading' },
    { date: '2023-12-01', score: 75, domain: 'Reading' },
    { date: '2024-03-01', score: 82, domain: 'Reading' }, 
];

const MOCK_INTERVENTIONS = [
    { date: '2023-10-01', label: 'Start Catch Up Literacy' }
];

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState("identity");

    // UNWRAP PARAMS (Next.js 15 Fix)
    const { id } = use(params);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Profile</h1>
                    <p className="text-muted-foreground">System ID: {id}</p>
                </div>
            </div>

            <Tabs defaultValue="identity" onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="identity">Identity & Records</TabsTrigger>
                    {can('view_psychometrics') && <TabsTrigger value="assessment">Clinical Assessment</TabsTrigger>}
                    <TabsTrigger value="progress">Longitudinal Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="mt-0">
                    <Student360Main studentId={id} />
                </TabsContent>

                <TabsContent value="assessment" className="mt-0 space-y-8">
                    {can('view_sensitive_notes') ? (
                        <>
                            <div className="grid gap-6">
                                <PsychometricProfileChart data={MOCK_SCORES} />
                                <SmartInterventionMapper scores={MOCK_SCORES} />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
                            <Shield className="h-12 w-12 mb-4 text-slate-400" />
                            <h3 className="text-lg font-semibold">Restricted Access</h3>
                            <p className="text-sm">Detailed psychometric data is restricted to Clinical Staff (EPP/DSL).</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="progress" className="mt-0">
                    <LongitudinalProgressChart 
                        data={MOCK_PROGRESS} 
                        interventions={MOCK_INTERVENTIONS}
                        goalScore={100}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
