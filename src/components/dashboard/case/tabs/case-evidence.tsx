// src/components/dashboard/case/tabs/case-evidence.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservationMode } from '@/components/assessments/ObservationMode'; 
import { Button } from '@/components/ui/button';
import { Mic, FileText, Activity, Loader2, Eye, Play, CheckCircle2, Calculator, BookOpen } from 'lucide-react';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Production Components
import { WiscVEntryForm } from '@/components/assessments/forms/WiscVEntryForm'; 
import { DynamicAssessmentSelector } from '@/components/assessments/DynamicAssessmentSelector';

export function CaseEvidence({ caseId, studentId }: { caseId: string, studentId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [observations, setObservations] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingSession, setStartingSession] = useState(false);

    // Dialog States
    const [isWiscOpen, setIsWiscOpen] = useState(false);
    const [isDynamicOpen, setIsDynamicOpen] = useState(false);

    useEffect(() => {
        async function loadEvidence() {
            if (!user) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                
                // Fetch Observations
                const obsQ = query(collection(db, 'observations'), where('caseId', '==', caseId));
                const obsSnap = await getDocs(obsQ);
                setObservations(obsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch Consultation Sessions 
                const sessQ = query(collection(db, 'consultation_sessions'), where('caseId', '==', caseId));
                const sessSnap = await getDocs(sessQ);
                const sessList = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                sessList.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                setSessions(sessList);

                // Fetch Assessments (Results)
                const assQ = query(collection(db, 'assessment_results'), where('caseId', '==', caseId));
                const assSnap = await getDocs(assQ);
                setAssessments(assSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (e) {
                console.error("Evidence Load Failed", e);
            } finally {
                setLoading(false);
            }
        }
        loadEvidence();
    }, [caseId, user, isWiscOpen, isDynamicOpen]); // Reload on close

    const handleStartSession = async () => {
        if (!user || startingSession) return;
        setStartingSession(true);
        try {
            const db = getRegionalDb(user.region || 'uk');
            const docRef = await addDoc(collection(db, 'consultation_sessions'), {
                caseId,
                studentId,
                tenantId: user.tenantId,
                status: 'live',
                startTime: new Date().toISOString(),
                participants: [],
                transcript: [],
                clinicalNotes: [],
                createdBy: user.uid,
                title: 'Ad-hoc Consultation'
            });
            toast({ title: "Session Created", description: "Launching Live Cockpit..." });
            router.push(`/dashboard/consultations/live/${docRef.id}`);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to start session.", variant: "destructive" });
            setStartingSession(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Evidence Lab</h3>
            
            <Tabs defaultValue="consultation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="consultation">Consultation (Voice)</TabsTrigger>
                    <TabsTrigger value="observation">Observation (Visual)</TabsTrigger>
                    <TabsTrigger value="direct_work">Direct Work (Data)</TabsTrigger>
                </TabsList>

                {/* Sub-Tab 1: Consultation */}
                <TabsContent value="consultation" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                            <CardHeader><CardTitle className="text-indigo-900">Live Consultation</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
                                <Button 
                                    size="lg" 
                                    onClick={handleStartSession}
                                    disabled={startingSession}
                                    className="rounded-full h-20 w-20 bg-indigo-600 hover:bg-indigo-700 shadow-xl transition-all hover:scale-105"
                                >
                                    {startingSession ? <Loader2 className="h-8 w-8 animate-spin"/> : <Mic className="h-8 w-8 text-white" />}
                                </Button>
                                <p className="text-sm text-indigo-600 font-medium">Start New Session</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Session History</CardTitle></CardHeader>
                            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                                {sessions.length === 0 ? <div className="p-6 text-center text-muted-foreground text-sm">No sessions recorded yet.</div> :
                                 sessions.map(s => (
                                    <div key={s.id} className="p-4 border-b flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{s.title || 'Consultation'}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.startTime), { addSuffix: true })}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => router.push(s.status === 'live' ? `/dashboard/consultations/live/${s.id}` : `/dashboard/consultations/synthesis/${s.id}`)}>
                                            {s.status === 'live' ? 'Resume' : 'View'}
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Sub-Tab 2: Observation */}
                <TabsContent value="observation" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {observations.map(obs => (
                            <Card key={obs.id} className="bg-indigo-50 border-indigo-100">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-indigo-900">{obs.setting}</p>
                                        <p className="text-xs text-indigo-700">{obs.date ? formatDistanceToNow(new Date(obs.date)) : 'Recently'} ago</p>
                                    </div>
                                    <Button size="icon" variant="ghost"><Eye className="w-4 h-4 text-indigo-500"/></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">New Classroom Observation</CardTitle></CardHeader>
                        <CardContent>
                            <ObservationMode />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sub-Tab 3: Direct Work (HARDENED) */}
                <TabsContent value="direct_work" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* WISC-V Launchpad */}
                        <Dialog open={isWiscOpen} onOpenChange={setIsWiscOpen}>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:border-indigo-400 transition-all hover:bg-indigo-50/50 group">
                                    <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Calculator className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-800">WISC-V Assessment</h3>
                                            <p className="text-sm text-slate-500">Record standardized scores (Index & Subtests)</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader><DialogTitle>WISC-V Score Entry</DialogTitle></DialogHeader>
                                {/* Pass onSuccess to close dialog */}
                                <WiscVEntryForm studentId={studentId} /> 
                            </DialogContent>
                        </Dialog>

                        {/* Dynamic Assessment Launchpad */}
                        <Dialog open={isDynamicOpen} onOpenChange={setIsDynamicOpen}>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:border-emerald-400 transition-all hover:bg-emerald-50/50 group">
                                    <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                                        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-800">Dynamic Assessment</h3>
                                            <p className="text-sm text-slate-500">Launch templates (Reading, Phonics, SDQ)</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Start New Assessment</DialogTitle></DialogHeader>
                                <DynamicAssessmentSelector 
                                    studentId={studentId} 
                                    caseId={caseId} 
                                    onClose={() => setIsDynamicOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Results History */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Completed Assessments</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {assessments.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No assessments recorded for this case.</p>
                                ) : (
                                    assessments.map(ass => (
                                        <div key={ass.id} className="flex justify-between items-center p-3 border rounded hover:bg-slate-50">
                                            <div>
                                                <p className="font-medium text-sm">{ass.templateId === 'wisc-v' ? 'WISC-V' : ass.templateId}</p>
                                                <p className="text-xs text-slate-500">{new Date(ass.startedAt || ass.completedAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant="outline">{ass.status || 'Completed'}</Badge>
                                            <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/assessments/results/${ass.id}`)}>
                                                View
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
