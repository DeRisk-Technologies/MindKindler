// src/components/dashboard/case/tabs/case-evidence.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservationMode } from '@/components/assessments/ObservationMode'; 
import { Button } from '@/components/ui/button';
import { Mic, FileText, Activity, Loader2, Eye, Play, CheckCircle2 } from 'lucide-react';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function CaseEvidence({ caseId, studentId }: { caseId: string, studentId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [observations, setObservations] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingSession, setStartingSession] = useState(false);

    useEffect(() => {
        async function loadEvidence() {
            if (!user) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                
                // Fetch Observations
                const obsQ = query(collection(db, 'observations'), where('caseId', '==', caseId));
                const obsSnap = await getDocs(obsQ);
                setObservations(obsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch Consultation Sessions (The "Live Cockpit" Data)
                const sessQ = query(collection(db, 'consultation_sessions'), where('caseId', '==', caseId));
                const sessSnap = await getDocs(sessQ);
                // Sort by date desc
                const sessList = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                sessList.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                setSessions(sessList);

            } catch (e) {
                console.error("Evidence Load Failed", e);
            } finally {
                setLoading(false);
            }
        }
        loadEvidence();
    }, [caseId, user]);

    const handleStartSession = async () => {
        if (!user || startingSession) return;
        setStartingSession(true);
        try {
            const db = getRegionalDb(user.region || 'uk');
            
            // Create New Session
            const docRef = await addDoc(collection(db, 'consultation_sessions'), {
                caseId,
                studentId,
                tenantId: user.tenantId,
                status: 'live',
                startTime: new Date().toISOString(),
                participants: [], // Will be filled in Cockpit
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

                {/* Sub-Tab 1: Consultation (Harmonised) */}
                <TabsContent value="consultation" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Action Card */}
                        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                            <CardHeader>
                                <CardTitle className="text-indigo-900">Live Consultation</CardTitle>
                            </CardHeader>
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
                                <p className="text-xs text-indigo-400 text-center px-8">
                                    Real-time transcription, AI insights, and safeguarding alerts.
                                </p>
                            </CardContent>
                        </Card>

                        {/* History List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Session History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                                {loading ? <div className="p-4"><Loader2 className="animate-spin h-5 w-5"/></div> : 
                                 sessions.length === 0 ? <div className="p-6 text-center text-muted-foreground text-sm">No sessions recorded yet.</div> :
                                 sessions.map(s => (
                                    <div key={s.id} className="p-4 border-b flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{s.title || 'Consultation'}</p>
                                                {s.status === 'live' && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(s.startTime), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {s.status === 'live' ? (
                                                <Button size="sm" variant="destructive" onClick={() => router.push(`/dashboard/consultations/live/${s.id}`)}>
                                                    Resume <Play className="w-3 h-3 ml-2"/>
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/consultations/synthesis/${s.id}`)}>
                                                    View Analysis <FileText className="w-3 h-3 ml-2 text-indigo-600"/>
                                                </Button>
                                            )}
                                        </div>
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
                                        <p className="text-xs text-indigo-700">
                                            {obs.date ? formatDistanceToNow(new Date(obs.date)) : 'Recently'} ago
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <div className="bg-white px-2 py-1 rounded text-xs border border-indigo-200">
                                                On-Task: {obs.metrics?.onTask}%
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost"><Eye className="w-4 h-4 text-indigo-500"/></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">New Classroom Observation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ObservationMode />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sub-Tab 3: Direct Work (Assessments) */}
                <TabsContent value="direct_work" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Standardized Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-24 flex flex-col gap-2">
                                    <Activity className="w-6 h-6" />
                                    WISC-V Input
                                </Button>
                                <Button variant="outline" className="h-24 flex flex-col gap-2">
                                    <Activity className="w-6 h-6" />
                                    Dynamic Assessment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
