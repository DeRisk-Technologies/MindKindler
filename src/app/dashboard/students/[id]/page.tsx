// src/app/dashboard/students/[id]/page.tsx

"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { PsychometricProfileChart } from '@/components/analytics/PsychometricProfileChart';
import { SmartInterventionMapper } from '@/components/interventions/SmartInterventionMapper';
import { LongitudinalProgressChart } from '@/components/analytics/LongitudinalProgressChart';
import { Shield, Brain, TrendingUp, FileText } from 'lucide-react';

// Mock Data for Demo
const MOCK_SCORES = [
    { name: 'VCI', score: 82, ciLow: 77, ciHigh: 87 },
    { name: 'VSI', score: 95, ciLow: 90, ciHigh: 100 },
    { name: 'FRI', score: 74, ciLow: 69, ciHigh: 79 }, // Significant Low
    { name: 'WMI', score: 88, ciLow: 83, ciHigh: 93 },
    { name: 'PSI', score: 92, ciLow: 87, ciHigh: 97 },
];

const MOCK_PROGRESS = [
    { date: '2023-09-01', score: 70, domain: 'Reading' },
    { date: '2023-12-01', score: 75, domain: 'Reading' },
    { date: '2024-03-01', score: 82, domain: 'Reading' }, // Improved
];

const MOCK_INTERVENTIONS = [
    { date: '2023-10-01', label: 'Start Catch Up Literacy' }
];

export default function StudentProfilePage({ params }: { params: { id: string } }) {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Student Profile</h1>
                    <p className="text-muted-foreground">ID: {params.id}</p>
                </div>
            </div>

            <Tabs defaultValue="overview" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {can('view_psychometrics') && <TabsTrigger value="assessment">Assessment</TabsTrigger>}
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    {can('view_sensitive_notes') && <TabsTrigger value="safeguarding" className="text-red-600">Safeguarding</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Identity & Context</CardTitle></CardHeader>
                        <CardContent>Basic profile info here...</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assessment" className="mt-6 space-y-6">
                    {/* 1. Psychometric Chart (Restricted) */}
                    {can('view_sensitive_notes') ? (
                        <div className="space-y-6">
                            <PsychometricProfileChart data={MOCK_SCORES} />
                            
                            {/* 2. Automated Recommendations (Phase 10) */}
                            <SmartInterventionMapper scores={MOCK_SCORES} />
                        </div>
                    ) : (
                        <div className="p-12 text-center border rounded bg-slate-50 text-slate-500">
                            <Shield className="mx-auto h-8 w-8 mb-2" />
                            Detailed psychometrics are restricted to Clinical Staff.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                    {/* 3. Longitudinal Tracking (Phase 10) */}
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
