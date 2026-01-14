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
import { WiscVEntryForm } from '@/components/assessments/forms/WiscVEntryForm'; 
import { QuickActionsBar } from './QuickActionsBar'; 
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Phase 41: Data Triangulation Panels
import { FamilyVoicePanel } from './FamilyVoicePanel';
import { SchoolDataPanel } from './SchoolDataPanel';

interface Student360Props {
    student: any;
    assessments?: any[];
    interventions?: any[];
    alerts?: any[];
}

export function Student360Main({ student, assessments = [], interventions = [], alerts = [] }: Student360Props) {
    const [activeTab, setActiveTab] = useState("overview");
    const router = useRouter();
    const { toast } = useToast();

    // Guard Clause
    if (!student || !student.identity) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse" />
            </div>
        );
    }

    const firstName = student.identity?.firstName?.value || 'Unknown';
    const lastName = student.identity?.lastName?.value || '';
    const yearGroup = student.education?.yearGroup?.value || 'N/A';
    const schoolName = student.education?.currentSchoolId?.value || 'No School Linked';

    // Handlers
    const handleStartSession = () => router.push(`/dashboard/consultations/new?studentId=${student.id}`);
    const handleLogNote = () => console.log("Log Note Triggered"); 
    const handleUpload = () => setActiveTab("documents"); 
    const handleMessage = () => console.log("Message Parent");

    // Alert Handlers
    const handleSnooze = (id: string) => toast({ title: "Snoozed", description: "Alert snoozed for 24h." });
    const handleCreateCase = (id: string) => router.push(`/dashboard/cases/new?studentId=${student.id}&alertId=${id}`);
    const handleOpenConsultation = (id: string) => router.push(`/dashboard/consultations/new?studentId=${student.id}&contextId=${id}`);

    return (
        <div className="space-y-6">
            
            {/* Header / Summary */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{firstName} {lastName}</h2>
                    <p className="text-slate-500">Year {yearGroup} • {schoolName}</p>
                </div>
                {/* Alerts Banner - Fixed Props */}
                <div className="flex gap-2">
                    {alerts.map(a => (
                        <AlertCard 
                            key={a.id} 
                            alert={a} 
                            onSnooze={handleSnooze}
                            onCreateCase={handleCreateCase}
                            onOpenConsultation={handleOpenConsultation}
                        />
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
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

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* LEFT: Family Voice (Section A) */}
                       <div className="space-y-6 h-full">
                           <FamilyVoicePanel student={student} />
                           
                           {/* Timeline */}
                           <Card>
                               <CardHeader className="py-3 bg-slate-50/50"><CardTitle className="text-sm text-slate-600">Progress Tracking</CardTitle></CardHeader>
                               <CardContent className="pt-4"><LongitudinalProgressChart data={assessments} /></CardContent>
                           </Card>
                       </div>

                       {/* RIGHT: School Data (Section B/F) */}
                       <div className="space-y-6 h-full">
                           <SchoolDataPanel student={student} />
                           
                           <Card>
                               <CardHeader className="py-3 bg-slate-50/50"><CardTitle className="text-sm text-slate-600">Key Contacts</CardTitle></CardHeader>
                               <CardContent>
                                   <div className="text-sm text-slate-500">Parents: {student.family?.parents?.map((p: any) => p.firstName).join(', ') || "None recorded"}</div>
                                   <div className="text-sm text-slate-500 mt-1">Social Worker: {student.careHistory?.socialWorker?.name || "None"}</div>
                               </CardContent>
                           </Card>
                       </div>
                    </div>
                </TabsContent>

                <TabsContent value="clinical" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <PsychometricProfileChart data={assessments} />
                        </div>
                        <div className="space-y-4">
                            <WiscVEntryForm studentId={student.id} />
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

                <TabsContent value="academic">
                    <Card>
                        <CardHeader><CardTitle>LMS Sync Data</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-slate-500 text-sm">Data from SIMS/Arbor/PowerSchool.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    {/* Fixed Prop: passing studentId allowed now */}
                    <EvidencePanel studentId={student.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
