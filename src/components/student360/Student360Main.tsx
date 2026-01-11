// src/components/student360/Student360Main.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Activity, Brain, Users, FolderOpen } from 'lucide-react';
import { EvidencePanel } from './EvidencePanel';
import { PsychometricProfileChart } from '@/components/analytics/PsychometricProfileChart';
import { LongitudinalProgressChart } from '@/components/analytics/LongitudinalProgressChart';
import { AlertCard } from './AlertCard';
import { WiscVEntryForm } from '@/components/assessments/forms/WiscVEntryForm'; // Phase 28
import { QuickActionsBar } from './QuickActionsBar'; // Restoring QuickActions
import { useRouter } from 'next/navigation';

interface Student360Props {
    student: any;
    assessments?: any[];
    interventions?: any[];
    alerts?: any[];
}

export function Student360Main({ student, assessments = [], interventions = [], alerts = [] }: Student360Props) {
    const [activeTab, setActiveTab] = useState("overview");
    const router = useRouter();

    // Restored Quick Actions Handlers
    const handleStartSession = () => router.push(`/dashboard/consultations/new?studentId=${student.id}`);
    const handleLogNote = () => console.log("Log Note Triggered"); // Placeholder for future modal
    const handleUpload = () => setActiveTab("documents"); // Jump to tab
    const handleMessage = () => console.log("Message Parent");

    return (
        <div className="space-y-6">
            
            {/* Header / Summary */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{student.identity.firstName.value} {student.identity.lastName.value}</h2>
                    <p className="text-slate-500">Year {student.education.yearGroup?.value} • {student.education.currentSchoolId?.value}</p>
                </div>
                {/* Alerts Banner */}
                <div className="flex gap-2">
                    {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
                </div>
            </div>

            {/* Restored Quick Actions Bar */}
            <QuickActionsBar 
                onStartSession={handleStartSession}
                onLogNote={handleLogNote}
                onUpload={handleUpload}
                onMessage={handleMessage}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical Data</TabsTrigger>
                    <TabsTrigger value="academic">Academic (LMS)</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview (Existing) */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-2 gap-4">
                       <Card>
                           <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                           <CardContent><LongitudinalProgressChart data={assessments} /></CardContent>
                       </Card>
                       <Card>
                           <CardHeader><CardTitle>Key Contacts</CardTitle></CardHeader>
                           <CardContent>
                               {/* Parent / Staff List */}
                               <div className="text-sm text-slate-500">Parents: {student.family?.parents?.map((p: any) => p.firstName).join(', ')}</div>
                           </CardContent>
                       </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Clinical Data (Enhanced) */}
                <TabsContent value="clinical" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. The Psychometric Chart (Visual) */}
                        <div className="space-y-4">
                            <PsychometricProfileChart data={assessments} />
                        </div>

                        {/* 2. Manual Entry Form (The Missing Link) */}
                        <div className="space-y-4">
                            <WiscVEntryForm studentId={student.id} />
                            
                            {/* History List */}
                            <Card>
                                <CardHeader className="py-3"><CardTitle className="text-sm">Assessment History</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    {assessments.map((a: any) => (
                                        <div key={a.id} className="p-3 border-b flex justify-between items-center text-sm">
                                            <span>{a.templateId}</span>
                                            <span className="font-mono">{new Date(a.completedAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                    {assessments.length === 0 && <div className="p-4 text-slate-400 italic text-xs">No records found.</div>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 3: Academic / LMS (Placeholder for Connector Data) */}
                <TabsContent value="academic">
                    <Card>
                        <CardHeader><CardTitle>LMS Sync Data</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-slate-500 text-sm">
                                Data from SIMS/Arbor/PowerSchool would appear here (Grades, Attendance).
                                <br/> *Connector logic handles ingestion into `external_academic_records` collection.*
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Documents */}
                <TabsContent value="documents">
                    <EvidencePanel studentId={student.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
