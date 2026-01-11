// src/app/dashboard/cases/[id]/page.tsx
"use client";

import React, { useEffect, useState, use } from 'react';
import { notFound, useRouter } from "next/navigation";
import { 
    doc, getDoc, collection, query, where, getDocs 
} from 'firebase/firestore';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, AlertTriangle, Plus, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Phase 23 Components
import { StatutoryTimeline } from '@/components/cases/StatutoryTimeline';

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<any>(null);
    const [studentData, setStudentData] = useState<any>(null);
    
    // Evidence Lists
    const [consultations, setConsultations] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        async function loadCaseContext() {
            try {
                // 1. Resolve Region
                let region = user?.region;
                if (!region || region === 'default') {
                    const rRef = doc(globalDb, 'user_routing', user?.uid || 'unknown');
                    const rSnap = await getDoc(rRef);
                    region = rSnap.exists() ? rSnap.data().region : 'uk';
                }
                const db = getRegionalDb(region);

                // 2. Fetch Case
                const caseRef = doc(db, 'cases', id);
                const caseSnap = await getDoc(caseRef);
                
                if (!caseSnap.exists()) {
                    setLoading(false);
                    return;
                }
                
                const cData = caseSnap.data();
                setCaseData({ id: caseSnap.id, ...cData });

                // 3. Fetch Student (Subject)
                if (cData.subjectId) {
                    const studentSnap = await getDoc(doc(db, 'students', cData.subjectId));
                    if (studentSnap.exists()) setStudentData(studentSnap.data());

                    // 4. Fetch Linked Evidence (Consultations)
                    const consultQ = query(
                        collection(db, 'consultation_sessions'), 
                        where('studentId', '==', cData.subjectId)
                    );
                    const consultSnaps = await getDocs(consultQ);
                    setConsultations(consultSnaps.docs.map(d => ({ id: d.id, ...d.data() })));

                    // 5. Fetch Linked Evidence (Assessments)
                    const assessQ = query(
                        collection(db, 'assessment_results'),
                        where('studentId', '==', cData.subjectId)
                    );
                    const assessSnaps = await getDocs(assessQ);
                    setAssessments(assessSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
                }

            } catch (e) {
                console.error("Failed to load case", e);
            } finally {
                setLoading(false);
            }
        }
        loadCaseContext();
    }, [id, user]);

    const handleDraftAdvice = () => {
        // Validation Rule: Must have evidence
        if (consultations.length === 0 && assessments.length === 0) {
            toast({
                title: "Evidence Missing",
                description: "Cannot draft statutory advice without a consultation or assessment record.",
                variant: "destructive"
            });
            return;
        }

        // Proceed to Builder
        const params = new URLSearchParams({
            studentId: caseData.subjectId,
            caseId: id,
            templateId: 'ehcp_needs_assessment', // Statutory Template
            mode: 'statutory'
        });
        
        router.push(`/dashboard/reports/builder?${params.toString()}`);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!caseData) return notFound();

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider">Case {caseData.id.slice(0,6)}</Badge>
                        <Badge className={caseData.priority === 'Critical' ? 'bg-red-500' : 'bg-blue-500'}>{caseData.priority}</Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {studentData?.identity?.firstName?.value} {studentData?.identity?.lastName?.value}
                    </h1>
                    <p className="text-slate-500">Statutory Assessment (EHCP) • {studentData?.education?.currentSchoolId?.value || "School Unknown"}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4" /> Link External Doc</Button>
                    <Button onClick={() => router.push(`/dashboard/consultations/new?studentId=${caseData.subjectId}`)}>
                        <Plus className="mr-2 h-4 w-4" /> New Consultation
                    </Button>
                </div>
            </div>

            {/* Phase 23: Timeline Widget */}
            <StatutoryTimeline 
                startDate={caseData.createdAt} 
                currentStage={caseData.stage || 'evidence'} 
            />

            {/* Tabs */}
            <Tabs defaultValue="evidence" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="evidence">Evidence Bank ({consultations.length + assessments.length})</TabsTrigger>
                    <TabsTrigger value="output">Statutory Output</TabsTrigger>
                    <TabsTrigger value="timeline">Full Audit Trail</TabsTrigger>
                </TabsList>

                <TabsContent value="evidence" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Consultations List */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium uppercase text-slate-500">Consultation Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {consultations.length === 0 ? (
                                    <div className="text-sm text-slate-400 italic">No sessions recorded.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {consultations.map(c => (
                                            <div key={c.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                                <div>
                                                    <div className="font-medium text-sm">Session: {c.mode || "Standard"}</div>
                                                    <div className="text-xs text-slate-500">{new Date(c.date || c.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/consultations/synthesis/${c.id}`)}>
                                                    View
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assessments List */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium uppercase text-slate-500">Psychometric Assessments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {assessments.length === 0 ? (
                                    <div className="text-sm text-slate-400 italic">No assessments completed.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {assessments.map(a => (
                                            <div key={a.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                                <div>
                                                    <div className="font-medium text-sm">{a.templateId}</div>
                                                    <div className="text-xs text-slate-500">Score: {a.totalScore}</div>
                                                </div>
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="output" className="space-y-4">
                    <Card className="bg-indigo-50 border-indigo-100">
                        <CardHeader>
                            <CardTitle className="text-indigo-900">Appendix K: Educational Advice</CardTitle>
                            <CardDescription className="text-indigo-700">
                                Draft the formal statutory advice for the Local Authority. This will pull all triangulated evidence.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-center">
                                <div className="p-3 bg-white rounded-full text-indigo-600 border border-indigo-200">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Status: {consultations.length > 0 ? 'Ready to Draft' : 'Evidence Pending'}</div>
                                    <div className="text-xs text-slate-500">Deadline: Week 6</div>
                                </div>
                                <Button onClick={handleDraftAdvice} className="bg-indigo-600 hover:bg-indigo-700">
                                    Start Drafting
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
