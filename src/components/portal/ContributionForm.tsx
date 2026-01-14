// src/components/portal/ContributionForm.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { submitContribution } from '@/app/actions/portal';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ContributionFormProps {
    requestId: string;
    token: string;
    type: string;
    recipientRole: string;
}

export function ContributionForm({ requestId, token, type, recipientRole }: ContributionFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Simple state for now - replace with detailed forms in future tasks
    const [formData, setFormData] = useState<any>({}); 

    const handleSubmit = async () => {
        if (!formData.generalViews && !formData.schoolAdvice) {
             toast({ title: "Empty Form", description: "Please enter some information before submitting.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        try {
            await submitContribution(requestId, token, formData);
            setIsSuccess(true);
        } catch (e) {
            toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Thank You!</h3>
                <p className="text-slate-500 mt-2">Your views have been securely received and will be included in the assessment.</p>
                <p className="text-xs text-slate-400 mt-8">You may close this window.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {type === 'parent_view' ? (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4">
                        <strong>Guidance:</strong> This information contributes to Section A of the Statutory Advice. Focus on your child's strengths, aspirations, and what support works best at home.
                    </div>
                    
                    <label className="block text-sm font-medium text-slate-700">Your Views</label>
                    <textarea 
                        className="w-full border rounded-md p-3 text-sm min-h-[200px] focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g., 'Charlie is very creative and loves Lego. He struggles with loud noises...'"
                        onChange={(e) => setFormData({ ...formData, generalViews: e.target.value })}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-100 text-sm text-amber-800 mb-4">
                        <strong>Guidance for SENCOs:</strong> Please summarize current attainment (NC Levels / Standardized Scores) and the impact of Wave 2/3 interventions.
                    </div>

                    <label className="block text-sm font-medium text-slate-700">Professional Advice</label>
                    <textarea 
                        className="w-full border rounded-md p-3 text-sm min-h-[200px] focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g., 'Reading Age: 6y 2m. Interventions: Talk Boost (6 weeks) - minimal progress...'"
                        onChange={(e) => setFormData({ ...formData, schoolAdvice: e.target.value })}
                    />
                </div>
            )}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                Submit Securely
            </Button>
        </div>
    );
}
