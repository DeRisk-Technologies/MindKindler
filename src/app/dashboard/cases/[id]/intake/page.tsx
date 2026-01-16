"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EvidenceUploadZone } from '@/components/intake/EvidenceUploadZone';
import { StakeholderMapper } from '@/components/intake/StakeholderMapper';
import { FactChecker } from '@/components/intake/FactChecker';
import { IngestionAnalysis, EvidenceItem } from '@/types/evidence';
import { Stakeholder, CaseFile } from '@/types/case';
import { Button } from '@/components/ui/button';
import { Steps } from '@/components/ui/steps'; // Hypothetical steps component
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

type IntakeStep = 'upload' | 'stakeholders' | 'facts' | 'complete';

export default function IntakePage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const caseId = params.id as string;

    const [currentStep, setCurrentStep] = useState<IntakeStep>('upload');
    const [saving, setSaving] = useState(false);
    
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
        setSaving(true);
        
        if (!user) {
            console.error("No authenticated user found during intake save.");
            return;
        }

        try {
            console.log("Committing Intake Data...", {
                caseId,
                evidenceCount: evidence.length,
                stakeholders: confirmedStakeholders,
                statutoryStart: facts.requestDate,
                dob: facts.dob
            });

            // 1. Resolve DB
            const db = await getRegionalDb(user.region || 'uk');

            // 2. Construct Case Object
            // Note: We infer student name from the first file or generic, allowing edit later.
            // In a real app, we'd ask the user to confirm the Student Name in the wizard.
            const studentName = "Student (Intake Pending)"; 

            const newCase: CaseFile = {
                id: caseId,
                tenantId: user.tenantId || 'default',
                studentId: `student-${caseId}`, // Placeholder ID
                studentName: studentName,
                dob: facts.dob,
                upn: '', // To be filled
                localAuthorityId: 'Pending LA', 
                region: user.region || 'uk',
                status: 'assessment', // Moving from Intake to Assessment phase
                flags: {
                    isNonVerbal: false, // Default, would come from AI
                    requiresGuardianPresence: false,
                    hasSocialWorker: confirmedStakeholders.some(s => s.role === 'social_worker'),
                    safeguardingRisk: facts.acknowledgedRisks
                },
                stakeholders: confirmedStakeholders,
                statutoryTimeline: {
                    requestDate: facts.requestDate,
                    decisionToAssessDeadline: new Date(new Date(facts.requestDate).getTime() + 42 * 86400000).toISOString(), // +6 weeks
                    evidenceDeadline: new Date(new Date(facts.requestDate).getTime() + 84 * 86400000).toISOString(), // +12 weeks
                    draftPlanDeadline: new Date(new Date(facts.requestDate).getTime() + 112 * 86400000).toISOString(), // +16 weeks
                    finalPlanDeadline: new Date(new Date(facts.requestDate).getTime() + 140 * 86400000).toISOString(), // +20 weeks
                    isOverdue: false
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid
            };

            // 3. Write to Firestore
            await setDoc(doc(db, 'cases', caseId), newCase);
            
            // 4. Ideally, create the 'Student' record as well to link it properly
            // For this pilot, the case record contains enough to display.

            // Simulate save delay
            await new Promise(r => setTimeout(r, 1000));

            // Redirect to Dashboard (FIXED: Uses plural /cases path)
            router.push(`/dashboard/cases/${caseId}`);

        } catch (err) {
            console.error("Error saving case:", err);
            setSaving(false);
            alert("Failed to save case. Please check console.");
        }
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isActive ? 'bg-blue-600 text-white' : 
                                    isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {idx + 1}
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
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
                        {saving && (
                            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center flex-col">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-blue-600 font-semibold">Creating Case File...</p>
                            </div>
                        )}
                        
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
