// src/components/assessments/forms/WiscVEntryForm.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

interface WiscVEntryFormProps {
    studentId: string;
    onComplete?: () => void;
}

export function WiscVEntryForm({ studentId, onComplete }: WiscVEntryFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [scores, setScores] = useState({
        VCI: "",
        VSI: "",
        FRI: "",
        WMI: "",
        PSI: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!user) return;
        setIsSaving(true);
        
        try {
            const db = getRegionalDb(user.region || 'uk');
            
            // 1. Create Assessment Result Record
            await addDoc(collection(db, 'assessment_results'), {
                studentId,
                templateId: 'WISC-V',
                category: 'Cognitive',
                responses: {
                    'Verbal Comprehension (VCI)': parseInt(scores.VCI),
                    'Visual Spatial (VSI)': parseInt(scores.VSI),
                    'Fluid Reasoning (FRI)': parseInt(scores.FRI),
                    'Working Memory (WMI)': parseInt(scores.WMI),
                    'Processing Speed (PSI)': parseInt(scores.PSI)
                },
                totalScore: Math.round((parseInt(scores.VCI) + parseInt(scores.VSI) + parseInt(scores.FRI) + parseInt(scores.WMI) + parseInt(scores.PSI)) / 5), // Approx FSIQ
                completedAt: new Date().toISOString(),
                status: 'graded',
                tenantId: user.tenantId
            });

            toast({ title: "Assessment Saved", description: "WISC-V scores recorded." });
            setScores({ VCI: "", VSI: "", FRI: "", WMI: "", PSI: "" }); // Reset
            onComplete?.();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to save assessment.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="py-3 bg-indigo-50/50">
                <CardTitle className="text-sm font-bold text-indigo-900">WISC-V Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-5 gap-2">
                    {Object.keys(scores).map((key) => (
                        <div key={key}>
                            <Label className="text-xs text-slate-500 mb-1 block">{key}</Label>
                            <Input 
                                type="number" 
                                className="h-8 text-center font-mono" 
                                placeholder="100"
                                value={(scores as any)[key]}
                                onChange={(e) => setScores(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Record Assessment"}
                </Button>
            </CardContent>
        </Card>
    );
}
