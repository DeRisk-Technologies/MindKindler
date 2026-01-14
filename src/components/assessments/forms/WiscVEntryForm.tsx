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
        
        // Validation: Ensure all fields are numbers
        const safeParse = (val: string) => {
            const num = parseInt(val);
            return isNaN(num) ? 0 : num;
        };

        const vci = safeParse(scores.VCI);
        const vsi = safeParse(scores.VSI);
        const fri = safeParse(scores.FRI);
        const wmi = safeParse(scores.WMI);
        const psi = safeParse(scores.PSI);

        if (vci === 0 && vsi === 0) {
            toast({ title: "Invalid Scores", description: "Please enter at least one valid score.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        
        try {
            // Default to UK if region missing (Pilot safety)
            const region = user.region || 'uk';
            const db = getRegionalDb(region);
            
            // 1. Create Assessment Result Record
            await addDoc(collection(db, 'assessment_results'), {
                studentId,
                templateId: 'WISC-V',
                category: 'Cognitive',
                responses: {
                    'Verbal Comprehension (VCI)': vci,
                    'Visual Spatial (VSI)': vsi,
                    'Fluid Reasoning (FRI)': fri,
                    'Working Memory (WMI)': wmi,
                    'Processing Speed (PSI)': psi
                },
                // Calc approximate total if not full
                totalScore: Math.round((vci + vsi + fri + wmi + psi) / 5), 
                completedAt: new Date().toISOString(),
                status: 'graded',
                tenantId: user.tenantId || 'default' // Ensure tenantId is never undefined
            });

            toast({ title: "Assessment Saved", description: "WISC-V scores recorded." });
            setScores({ VCI: "", VSI: "", FRI: "", WMI: "", PSI: "" }); // Reset
            onComplete?.();
        } catch (e: any) {
            console.error("WISC-V Save Error:", e);
            // Show more detailed error if permission denied
            if (e.code === 'permission-denied') {
                toast({ title: "Permission Denied", description: "You do not have write access to this region.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: "Failed to save assessment. Check console.", variant: "destructive" });
            }
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
