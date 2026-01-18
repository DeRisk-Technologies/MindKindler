// src/components/assessments/DynamicAssessmentSelector.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { Loader2, Play, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface DynamicAssessmentSelectorProps {
    studentId: string;
    caseId: string;
    onClose?: () => void;
}

export function DynamicAssessmentSelector({ studentId, caseId, onClose }: DynamicAssessmentSelectorProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // Fetch Templates (e.g. Reading, Phonics, emotional literacy)
    // NOTE: Assessment Templates are usually global or system-wide, so might not be in regional DB or tenant scoped.
    // However, custom ones could be. For now, let's assume global/admin managed.
    const { data: templates, loading, error } = useFirestoreCollection('assessment_templates', 'title', 'asc');
    
    // Fallback: Hardcoded templates if DB is empty (common in dev/pilot)
    const hardcodedTemplates = [
        { id: 'wisc-v', title: 'WISC-V Digital Form', category: 'Cognitive' },
        { id: 'sdq', title: 'Strengths & Difficulties (SDQ)', category: 'Social' },
        { id: 'reading-comp', title: 'Reading Comprehension Lvl 2', category: 'Academic' }
    ];

    const effectiveTemplates = templates.length > 0 ? templates : hardcodedTemplates;

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        if (error) {
            console.warn("Template load error (permission?):", error);
            // We rely on fallback
        }
    }, [error]);

    const handleStart = async () => {
        if (!user) {
            toast({ title: "Auth Error", description: "Not authenticated.", variant: "destructive" });
            return;
        }
        if (!selectedTemplateId) return;
        
        setIsStarting(true);

        try {
            const region = user.region || 'uk';
            const db = getRegionalDb(region);
            
            // Create "In Progress" Result
            const resultRef = await addDoc(collection(db, 'assessment_results'), {
                templateId: selectedTemplateId,
                studentId,
                caseId,
                tenantId: user.tenantId || 'default', // Ensure valid tenantId
                status: 'in_progress',
                startedAt: new Date().toISOString(),
                conductorId: user.uid,
                answers: {},
                createdAt: serverTimestamp()
            });

            toast({ title: "Assessment Started", description: "Redirecting to assessment runner..." });
            
            // Navigate to the runner
            router.push(`/dashboard/assessments/results/${resultRef.id}`);
            
            if (onClose) onClose();

        } catch (e: any) {
            console.error(e);
             if (e.code === 'permission-denied') {
                toast({ title: "Permission Denied", description: "You do not have write access to start assessments here.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: e.message || "Failed to start assessment.", variant: "destructive" });
            }
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Assessment Tool</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                        {loading && templates.length === 0 ? (
                            <div className="p-2 flex justify-center"><Loader2 className="animate-spin h-4 w-4"/></div>
                        ) : effectiveTemplates.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.title} ({t.category || 'General'})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500">
                <p>This will launch the digital assessment form. You can complete this yourself (observation) or hand the device to the student.</p>
            </div>

            <Button onClick={handleStart} disabled={!selectedTemplateId || isStarting} className="w-full">
                {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                Begin Assessment
            </Button>
        </div>
    );
}
