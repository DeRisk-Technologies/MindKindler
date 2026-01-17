// src/components/dashboard/case/tabs/case-evidence.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservationMode } from '@/components/assessments/ObservationMode'; 
import { Button } from '@/components/ui/button';
import { Mic, FileText, Activity, Loader2, Eye } from 'lucide-react';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

export function CaseEvidence({ caseId, studentId }: { caseId: string, studentId: string }) {
    const { user } = useAuth();
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadEvidence() {
            if (!user) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                
                // Fetch Observations
                const obsQ = query(collection(db, 'observations'), where('caseId', '==', caseId));
                const obsSnap = await getDocs(obsQ);
                setObservations(obsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (e) {
                console.error("Evidence Load Failed", e);
            } finally {
                setLoading(false);
            }
        }
        loadEvidence();
    }, [caseId, user]);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Evidence Lab</h3>
            
            <Tabs defaultValue="observation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="observation">Observation</TabsTrigger>
                    <TabsTrigger value="consultation">Consultation</TabsTrigger>
                    <TabsTrigger value="direct_work">Direct Work</TabsTrigger>
                </TabsList>

                {/* Sub-Tab 1: Observation */}
                <TabsContent value="observation" className="mt-4 space-y-4">
                    {/* List Existing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loading ? <Loader2 className="animate-spin" /> : observations.map(obs => (
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

                {/* Sub-Tab 2: Consultation */}
                <TabsContent value="consultation" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Consultation Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center p-8 space-y-4">
                                <Button size="lg" className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 shadow-lg">
                                    <Mic className="h-8 w-8 text-white" />
                                </Button>
                                <p className="text-sm text-muted-foreground">Start Recording / Dictation</p>
                            </div>
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
