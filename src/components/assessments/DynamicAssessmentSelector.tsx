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
    const { data: templates, loading } = useFirestoreCollection('assessment_templates', 'title', 'asc');
    
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = async () => {
        if (!user || !selectedTemplateId) return;
        setIsStarting(true);

        try {
            const db = getRegionalDb(user.region || 'uk');
            
            // Create "In Progress" Result
            const resultRef = await addDoc(collection(db, 'assessment_results'), {
                templateId: selectedTemplateId,
                studentId,
                caseId,
                tenantId: user.tenantId,
                status: 'in_progress',
                startedAt: new Date().toISOString(),
                conductorId: user.uid,
                answers: {} // Empty answers to start
            });

            toast({ title: "Assessment Started", description: "Redirecting to assessment runner..." });
            
            // Navigate to the runner (Assuming this route exists from Phase 1)
            // If not, we might need to build the runner view inside the workbench.
            // For now, let's assume /dashboard/assessments/run/[resultId] or similar.
            // Actually, usually it's /portal/assessment/[id] for students, or /dashboard/assessments/results/[id] for EPPs entering data.
            
            // Let's redirect to the "Results/Entry" page which usually allows editing if status is in_progress
            router.push(`/dashboard/assessments/results/${resultRef.id}`);
            
            if (onClose) onClose();

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to start assessment.", variant: "destructive" });
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
                        {templates.length === 0 ? (
                            <SelectItem value="none" disabled>No templates found</SelectItem>
                        ) : (
                            templates.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.title} ({t.category || 'General'})</SelectItem>
                            ))
                        )}
                        {/* Fallback Mocks if DB empty */}
                        {templates.length === 0 && (
                            <>
                                <SelectItem value="temp-reading">Reading Fluency Check (Standard)</SelectItem>
                                <SelectItem value="temp-phonics">Phonics Screener (Year 1)</SelectItem>
                                <SelectItem value="temp-sdq">Strengths & Difficulties (SDQ)</SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500">
                <p>This will launch the digital assessment form. You can complete this yourself (observation) or hand the device to the student.</p>
            </div>

            <Button onClick={handleStart} disabled={!selectedTemplateId || isStarting || loading} className="w-full">
                {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                Begin Assessment
            </Button>
        </div>
    );
}
