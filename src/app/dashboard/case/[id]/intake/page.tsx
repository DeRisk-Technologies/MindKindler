"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EvidenceUploadZone } from '../../../../components/intake/EvidenceUploadZone';
import { StakeholderMapper } from '../../../../components/intake/StakeholderMapper';
import { FactChecker } from '../../../../components/intake/FactChecker';
import { IngestionAnalysis, EvidenceItem } from '../../../../types/evidence';
import { Stakeholder } from '../../../../types/case';
import { Button } from '../../../../components/ui/button';
import { Steps } from '../../../../components/ui/steps'; // Hypothetical steps component
import { Card, CardContent } from '../../../../components/ui/card';

type IntakeStep = 'upload' | 'stakeholders' | 'facts' | 'complete';

export default function IntakePage() {
    const router = useRouter();
    const params = useParams();
    const caseId = params.id as string;

    const [currentStep, setCurrentStep] = useState<IntakeStep>('upload');
    
    // Intake State Accumulator
    const [analyses, setAnalyses] = useState<IngestionAnalysis[]>([]);
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [confirmedStakeholders, setConfirmedStakeholders] = useState<Stakeholder[]>([]);
    const [confirmedFacts, setConfirmedFacts] = useState<{ requestDate: string; dob: string } | null>(null);

    // Step 1 Handler
    const handleUploadComplete = (items: EvidenceItem[], results: IngestionAnalysis[]) => {
        setEvidence(items);
        setAnalyses(results);
        setCurrentStep('stakeholders');
    };

    // Step 2 Handler
    const handleStakeholdersConfirmed = (stakeholders: Stakeholder[]) => {
        setConfirmedStakeholders(stakeholders);
        setCurrentStep('facts');
    };

    // Step 3 Handler
    const handleFactsConfirmed = async (facts: { requestDate: string; dob: string; acknowledgedRisks: boolean }) => {
        setConfirmedFacts(facts);
        
        // --- FINAL COMMIT ---
        // In a real app, we would POST this to an API endpoint to update the CaseFile.
        console.log("Committing Intake Data...", {
            caseId,
            evidenceCount: evidence.length,
            stakeholders: confirmedStakeholders,
            statutoryStart: facts.requestDate,
            dob: facts.dob
        });

        // Simulate save delay
        await new Promise(r => setTimeout(r, 1000));

        // Redirect to Dashboard
        router.push(\`/dashboard/case/\${caseId}\`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Intelligent Case Intake</h1>
                    <p className="mt-2 text-gray-600">Upload the LA Bundle. AI will extract dates, people, and risks.</p>
                </div>

                {/* Progress Stepper (Visual only for this demo) */}
                <div className="flex justify-center mb-8 gap-4">
                    {['Upload', 'Verify People', 'Verify Facts'].map((step, idx) => {
                        const stepKey = ['upload', 'stakeholders', 'facts'][idx] as IntakeStep;
                        const isActive = currentStep === stepKey;
                        const isPast = ['upload', 'stakeholders', 'facts'].indexOf(currentStep) > idx;
                        
                        return (
                            <div key={step} className="flex items-center gap-2">
                                <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold \${
                                    isActive ? 'bg-blue-600 text-white' : 
                                    isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                }\`}>
                                    {idx + 1}
                                </div>
                                <span className={\`text-sm font-medium \${isActive ? 'text-gray-900' : 'text-gray-500'}\`}>
                                    {step}
                                </span>
                                {idx < 2 && <div className="w-8 h-0.5 bg-gray-300" />}
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <Card className="min-h-[400px]">
                    <CardContent className="p-8">
                        
                        {currentStep === 'upload' && (
                            <EvidenceUploadZone onAnalysisComplete={handleUploadComplete} />
                        )}

                        {currentStep === 'stakeholders' && (
                            <StakeholderMapper 
                                analyses={analyses} 
                                onConfirm={handleStakeholdersConfirmed} 
                            />
                        )}

                        {currentStep === 'facts' && (
                            <FactChecker 
                                analyses={analyses} 
                                onConfirm={handleFactsConfirmed} 
                            />
                        )}

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
