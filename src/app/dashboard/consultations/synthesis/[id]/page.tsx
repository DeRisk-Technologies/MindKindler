// src/app/dashboard/consultations/synthesis/[id]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { PostSessionSynthesis, SynthesisResult } from '@/components/consultations/PostSessionSynthesis';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { getRegionalDb, db as globalDb } from '@/lib/firebase'; 
import { useAuth } from '@/hooks/use-auth'; 
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ConsultationSynthesisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth(); 
    
    const [loading, setLoading] = useState(true);
    const [activeShard, setActiveShard] = useState<string>('default');
    const [sessionData, setSessionData] = useState<{
        transcript: string;
        insights: any[];
        student: any;
    } | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!user) return; 

            try {
                let region = user.region;
                if (!region || region === 'default') {
                    const routingRef = doc(globalDb, 'user_routing', user.uid);
                    const routingSnap = await getDoc(routingRef);
                    if (routingSnap.exists()) {
                        region = routingSnap.data().region;
                    } else if (user.email?.toLowerCase().includes('uk')) {
                        region = 'uk';
                    }
                }
                
                setActiveShard(region || 'default');
                const db = getRegionalDb(region);
                
                const sessionRef = doc(db, 'consultation_sessions', id);
                const sessionSnap = await getDoc(sessionRef);
                
                if (!sessionSnap.exists()) {
                    // Fallback to default check (omitted for brevity, handled by LivePage fix usually)
                    console.error(`Session ${id} not found in ${region}`);
                    toast({ variant: "destructive", title: "Session not found", description: `Checked shard: ${region}` });
                    setLoading(false);
                    return;
                }

                const sData = sessionSnap.data();
                
                // Format Transcript
                let transcriptText = "";
                if (sData.transcript && Array.isArray(sData.transcript)) {
                    transcriptText = sData.transcript
                        .map((t: any) => `${t.speaker}: ${t.text}`)
                        .join('\n\n');
                } else if (typeof sData.transcript === 'string') {
                    transcriptText = sData.transcript; 
                }
                
                // Fetch Student
                let studentData = {};
                if (sData.studentId) {
                    const studentRef = doc(db, 'students', sData.studentId);
                    const studentSnap = await getDoc(studentRef);
                    if (studentSnap.exists()) {
                        studentData = studentSnap.data();
                    }
                }

                setSessionData({
                    transcript: transcriptText,
                    insights: sData.insights || [],
                    student: studentData
                });

            } catch (error) {
                console.error("Failed to load synthesis data", error);
                toast({ variant: "destructive", title: "Error loading data" });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, user, toast]);

    const handleComplete = async (synthesizedData: SynthesisResult) => {
        if (!user) return;

        try {
            console.log(`[Synthesis] Saving outcome to shard: ${activeShard}`);
            const db = getRegionalDb(activeShard);
            const sessionRef = doc(db, 'consultation_sessions', id);
            
            await updateDoc(sessionRef, {
                status: 'synthesized',
                synthesizedAt: new Date().toISOString(),
                outcome: {
                    clinicalOpinions: synthesizedData.confirmedOpinions,
                    interventionPlan: synthesizedData.plannedInterventions,
                    referrals: synthesizedData.referrals,
                    finalTranscript: synthesizedData.editedTranscript
                }
            });

            // ROUTING LOGIC based on Report Type
            if (synthesizedData.reportType === 'statutory') {
                toast({ title: "Drafting Statutory Report", description: "Redirecting to standard builder..." });
                router.push(`/dashboard/reports/builder?sourceSessionId=${id}&type=statutory`);
            } else {
                toast({ title: "Custom Report", description: "Select a template..." });
                router.push(`/dashboard/reports/templates?sourceSessionId=${id}`); // New Route for Templates
            }

        } catch (error) {
            console.error("Failed to save synthesis", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save synthesis data." });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-slate-500">Loading Session Data...</span>
            </div>
        );
    }

    if (!sessionData) return <div>Data unavailable</div>;

    return (
        <PostSessionSynthesis 
            sessionId={id}
            transcript={sessionData.transcript}
            initialInsights={sessionData.insights}
            student={sessionData.student}
            onComplete={handleComplete}
        />
    );
}
