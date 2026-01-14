// src/components/interventions/SmartInterventionMapper.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb, db } from '@/lib/firebase';
import { InterventionLogic } from '@/marketplace/types';
import { Sparkles, PlusCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
    scores: Array<{ name: string; score: number }>; // e.g. [{name: 'VCI', score: 82}]
    studentId?: string; // Phase 35: Linking to Student
}

export function SmartInterventionMapper({ scores, studentId }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [logic, setLogic] = useState<InterventionLogic[]>([]);
    const [recommendations, setRecommendations] = useState<InterventionLogic[]>([]);

    // 1. Fetch Intervention Logic from Installed Pack
    useEffect(() => {
        if (!user?.tenantId) return;
        async function fetchLogic() {
            try {
                // In a real app, this might be in settings/interventions or settings/analytics
                // For MVP, we assume the installer saved it to settings/analytics for simplicity
                // or we could add a dedicated doc. Let's assume settings/analytics has it.
                const snap = await getDoc(doc(db, `tenants/${user?.tenantId}/settings/analytics`));
                if (snap.exists() && snap.data().interventionLogic) {
                    setLogic(snap.data().interventionLogic);
                } else {
                     // Fallback/Mock logic for Demo if empty
                     setLogic([
                         { id: 'elklan', programName: 'ELKLAN Language Builders', domain: 'VCI', threshold: 85, evidenceLevel: 'gold', description: 'Structured oral language support for low Verbal Comprehension.' },
                         { id: 'talkboost', programName: 'Talk Boost (KS1/KS2)', domain: 'VCI', threshold: 85, evidenceLevel: 'silver', description: 'Targeted intervention for delayed language.' }
                     ]);
                }
            } catch (e) {
                console.error("Failed to load intervention logic", e);
            }
        }
        fetchLogic();
    }, [user?.tenantId]);

    // 2. Map Scores to Logic
    useEffect(() => {
        if (logic.length === 0 || scores.length === 0) return;

        const matches: InterventionLogic[] = [];
        
        scores.forEach(scoreRecord => {
            // Find rules for this domain (e.g. VCI) where score is below threshold
            const domainRules = logic.filter(l => 
                l.domain === scoreRecord.name && scoreRecord.score < l.threshold
            );
            matches.push(...domainRules);
        });

        // Dedupe
        const uniqueMatches = Array.from(new Set(matches.map(m => m.id)))
            .map(id => matches.find(m => m.id === id)!);

        setRecommendations(uniqueMatches);
    }, [logic, scores]);

    const handleAddToPlan = async (rec: InterventionLogic) => {
        if (!studentId) {
             toast({ title: "Error", description: "No student context found.", variant: "destructive" });
             return;
        }

        try {
            const region = user?.region || 'uk';
            const db = getRegionalDb(region);
            
            // Save to 'interventions' collection (or cases)
            // We'll create a new 'case' or 'intervention' record
            await addDoc(collection(db, 'cases'), {
                tenantId: user?.tenantId,
                type: 'intervention',
                studentId: studentId,
                title: `Intervention: ${rec.programName}`,
                status: 'planned',
                priority: 'Medium',
                description: rec.description,
                source: 'smart_mapper',
                evidenceBase: rec.evidenceLevel,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast({
                title: "Intervention Added",
                description: `Added "${rec.programName}" to the student's plan.`,
            });
        } catch (e) {
            console.error("Failed to add intervention", e);
            toast({ title: "Error", description: "Failed to save plan.", variant: "destructive" });
        }
    };

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-lg text-indigo-900">Recommended Interventions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map(rec => (
                    <Card key={rec.id} className="border-indigo-100 bg-indigo-50/30 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-bold text-slate-800">
                                    {rec.programName}
                                </CardTitle>
                                {rec.evidenceLevel && (
                                    <Badge variant="secondary" className={
                                        rec.evidenceLevel === 'gold' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100'
                                    }>
                                        {rec.evidenceLevel} Evidence
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-xs text-indigo-600 font-medium">
                                Triggered by Low {rec.domain} (&lt;{rec.threshold})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600">{rec.description}</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-xs h-8">
                                <BookOpen className="mr-1 h-3 w-3" /> Details
                            </Button>
                            <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAddToPlan(rec)}>
                                <PlusCircle className="mr-1 h-3 w-3" /> Add to Plan
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
