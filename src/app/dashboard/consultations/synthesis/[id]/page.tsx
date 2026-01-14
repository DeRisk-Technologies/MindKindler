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
        savedOutcome?: any; // To hold previously saved synthesis state
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
                    insights: sData.outcome?.clinicalOpinions || sData.insights || [],
                    student: studentData,
                    savedOutcome: sData.outcome // Pass saved state
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

    const handleSave = async (synthesizedData: SynthesisResult) => {
        if (!user) return;
        try {
            console.log(`[Synthesis] Saving progress to shard: ${activeShard}`);
            const db = getRegionalDb(activeShard);
            const sessionRef = doc(db, 'consultation_sessions', id);
            
            await updateDoc(sessionRef, {
                // Persist the outcome state without changing status to 'synthesized' (which implies completion)
                outcome: {
                    clinicalOpinions: synthesizedData.confirmedOpinions,
                    manualClinicalNotes: synthesizedData.manualClinicalNotes,
                    interventionPlan: synthesizedData.plannedInterventions,
                    referrals: synthesizedData.referrals,
                    finalTranscript: synthesizedData.editedTranscript
                },
                lastSavedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Failed to save synthesis", error);
            throw error;
        }
    };

    const handleComplete = async (synthesizedData: SynthesisResult) => {
        if (!user) return;

        try {
            console.log(`[Synthesis] Completing session in shard: ${activeShard}`);
            const db = getRegionalDb(activeShard);
            const sessionRef = doc(db, 'consultation_sessions', id);
            
            await updateDoc(sessionRef, {
                status: 'synthesized', // Mark as complete/ready for report
                synthesizedAt: new Date().toISOString(),
                outcome: {
                    clinicalOpinions: synthesizedData.confirmedOpinions,
                    manualClinicalNotes: synthesizedData.manualClinicalNotes, 
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
                toast({ title: "Custom Report / Referral", description: "Select a template..." });
                router.push(`/dashboard/reports/templates?sourceSessionId=${id}`); 
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

    // Separate manual notes from promoted evidence if possible, or just pass them as manual notes
    // In PostSessionSynthesis, manualClinicalNotes combines both on save. 
    // On restore, we might want to pass them to 'initialManualNotes' or 'initialPromotedEvidence'.
    // Since we can't easily distinguish them without structure, we'll pass them to 'initialPromotedEvidence' 
    // if they look like promoted text, or just dump them all in one bucket.
    // Ideally, the saved outcome should separate them. 
    // For now, let's pass savedOutcome.manualClinicalNotes to initialManualNotes.
    
    // Actually, looking at the code in PostSessionSynthesis:
    // manualClinicalNotes: [...manualOpinions, ...promotedEvidence]
    // It flattens them. 
    // So when we reload, they will all appear in the "Manual Notes" section if we pass them to initialManualNotes.
    // That's acceptable for now, or we can try to guess.
    
    return (
        <PostSessionSynthesis 
            sessionId={id}
            transcript={sessionData.savedOutcome?.finalTranscript || sessionData.transcript}
            initialInsights={sessionData.insights} // Use fresh insights or saved ones? 
            // Ideally: sessionData.savedOutcome?.clinicalOpinions || sessionData.insights
            // Note: fetchData sets insights to `sData.outcome?.clinicalOpinions || sData.insights`.
            // So `sessionData.insights` is already the best source.
            
            student={sessionData.student}
            
            // Restore State
            initialPlannedInterventions={sessionData.savedOutcome?.interventionPlan}
            initialReferrals={sessionData.savedOutcome?.referrals}
            // Since we flattened notes, let's just put them in manual notes for safety so they aren't lost.
            initialManualNotes={sessionData.savedOutcome?.manualClinicalNotes}
            
            onSave={handleSave}
            onComplete={handleComplete}
        />
    );
}
