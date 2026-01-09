// src/components/consultations/PostSessionSynthesis.tsx

"use client";

import React, { useState } from 'react';
import { 
    CheckCircle, AlertTriangle, FileText, ArrowRight, 
    Sparkles, Edit3, MessageSquare, Plus, Trash2,
    Clock, Activity, BrainCircuit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StudentRecord, AssessmentResult } from '@/types/schema';
import { InterventionLogic } from '@/marketplace/types';

import { askSessionQuestionAction, AiInsight } from '@/app/actions/consultation';
import { generateInterventionPlanAction, PlannedIntervention } from '@/app/actions/intervention';
import { useRouter } from 'next/navigation';

const MOCK_UK_LIBRARY: InterventionLogic[] = [
    { id: "uk_elklan_vci", domain: "VCI", threshold: 85, programName: "ELKLAN Language Builders", description: "Structured oral language support.", evidenceLevel: "gold" },
    { id: "uk_cogmed_wmi", domain: "WMI", threshold: 80, programName: "Cogmed Working Memory", description: "Digital training.", evidenceLevel: "silver" }
];

export interface SynthesisResult {
    confirmedOpinions: AiInsight[];
    plannedInterventions: PlannedIntervention[];
    referrals: string[];
    editedTranscript: string;
    reportType: 'statutory' | 'custom';
}

interface PostSessionSynthesisProps {
    sessionId: string;
    transcript: string;
    initialInsights: AiInsight[];
    student: Partial<StudentRecord>;
    assessments?: AssessmentResult[];
    onComplete: (data: SynthesisResult) => void; 
}

export function PostSessionSynthesis({ 
    sessionId, 
    transcript, 
    initialInsights, 
    student,
    assessments = [], 
    onComplete 
}: PostSessionSynthesisProps) {
    const { toast } = useToast();
    const router = useRouter(); 
    
    // State
    const [activeTab, setActiveTab] = useState('review');
    const [clinicalOpinions, setClinicalOpinions] = useState<AiInsight[]>(initialInsights);
    const [plannedInterventions, setPlannedInterventions] = useState<PlannedIntervention[]>([]);
    const [referrals, setReferrals] = useState<string[]>([]);
    const [editedTranscript, setEditedTranscript] = useState(transcript); 
    
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    
    // Q&A State
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isAsking, setIsAsking] = useState(false);

    // --- Helpers ---
    const sanitizeForServer = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj));
    };

    // --- Actions ---

    const toggleConfirmation = (id: string) => {
        setClinicalOpinions(prev => prev.map(op => 
            op.id === id ? { ...op, confirmed: !((op as any).confirmed) } : op
        ));
    };

    const generateTreatmentPlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const cleanStudent = sanitizeForServer(student);
            const cleanAssessments = sanitizeForServer(assessments);
            
            // Get only confirmed opinions to influence the plan
            const confirmedOpinions = clinicalOpinions.filter(op => (op as any).confirmed);

            const context = {
                transcript: editedTranscript, 
                student: cleanStudent,
                assessments: cleanAssessments,
                clinicalOpinions: confirmedOpinions, // Added: Pass confirmed opinions
                availableInterventions: MOCK_UK_LIBRARY 
            };
            
            const plans = await generateInterventionPlanAction(context);
            setPlannedInterventions(plans);
            
            toast({
                title: "Plan Generated",
                description: `Created ${plans.length} targeted interventions based on confirmed opinions.`,
            });
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to generate plan.", variant: "destructive" });
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleReferralAdd = (val: string) => {
        if (!referrals.includes(val)) setReferrals([...referrals, val]);
    };

    const askFollowUp = async () => {
        if (!question.trim()) return;
        setIsAsking(true);
        const cleanStudent = sanitizeForServer(student);
        const response = await askSessionQuestionAction(question, editedTranscript, cleanStudent);
        setAnswer(response);
        setIsAsking(false);
    };

    const handleDraftReport = (type: 'statutory' | 'custom') => {
        const synthesisResult: SynthesisResult = {
            confirmedOpinions: clinicalOpinions.filter(op => (op as any).confirmed), 
            plannedInterventions,
            referrals,
            editedTranscript,
            reportType: type
        };
        onComplete(synthesisResult);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Post-Session Synthesis</h1>
                    <p className="text-slate-500 text-sm">Review insights, confirm clinical opinions, and draft the statutory output.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleDraftReport('custom')}>
                        <Plus className="mr-2 h-4 w-4" /> Custom Report / Referral
                    </Button>
                    <Button onClick={() => handleDraftReport('statutory')} className="bg-indigo-600 hover:bg-indigo-700">
                        <FileText className="mr-2 h-4 w-4" /> Draft Statutory Report
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4">
                    <TabsTrigger value="review" className="rounded-t-lg data-[state=active]:bg-white data-[state=active]:border-b-indigo-500 data-[state=active]:text-indigo-700 border-b-2 border-transparent px-6 py-2">
                        1. Clinical Review
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="rounded-t-lg data-[state=active]:bg-white data-[state=active]:border-b-indigo-500 data-[state=active]:text-indigo-700 border-b-2 border-transparent px-6 py-2">
                        2. Treatment Plan
                    </TabsTrigger>
                    <TabsTrigger value="qa" className="rounded-t-lg data-[state=active]:bg-white data-[state=active]:border-b-indigo-500 data-[state=active]:text-indigo-700 border-b-2 border-transparent px-6 py-2">
                        3. AI Q&A
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Clinical Review */}
                <TabsContent value="review" className="flex-grow flex gap-6 mt-0">
                    <Card className="w-1/2 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">Session Transcript</CardTitle>
                            <CardDescription>Edit to correct transcription errors.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <Textarea 
                                className="h-full resize-none font-mono text-sm leading-relaxed p-4 focus-visible:ring-indigo-500"
                                value={editedTranscript}
                                onChange={(e) => setEditedTranscript(e.target.value)} 
                            />
                        </CardContent>
                    </Card>

                    <Card className="w-1/2 flex flex-col bg-slate-100/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                                AI Hypotheses &gt; Clinical Opinions
                            </CardTitle>
                            <CardDescription>Confirm observations to include them in the report.</CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-grow px-6 pb-6">
                            <div className="space-y-3">
                                {clinicalOpinions.map((insight) => (
                                    <div 
                                        key={insight.id} 
                                        className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                                            (insight as any).confirmed 
                                                ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:border-indigo-300'
                                        }`}
                                        onClick={() => toggleConfirmation(insight.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className={`uppercase text-[10px] ${
                                                insight.type === 'risk' ? 'text-red-600 bg-red-50' : 
                                                insight.type === 'strength' ? 'text-green-600 bg-green-50' : 'text-slate-600'
                                            }`}>
                                                {insight.type}
                                            </Badge>
                                            {(insight as any).confirmed ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-indigo-400" />
                                            )}
                                        </div>
                                        <p className={`text-sm ${(insight as any).confirmed ? 'text-emerald-900 font-medium' : 'text-slate-600'}`}>
                                            {insight.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* Tab 2: Treatment Plan */}
                <TabsContent value="plan" className="flex-grow flex gap-6 mt-0">
                    <Card className="w-2/3 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Intervention Plan</CardTitle>
                                <CardDescription>Smart-mapped from WISC-V Scores & Session Evidence.</CardDescription>
                            </div>
                            <Button onClick={generateTreatmentPlan} disabled={isGeneratingPlan} size="sm" variant="secondary">
                                {isGeneratingPlan ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                AI Generate
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-hidden">
                            <ScrollArea className="h-full pr-4">
                                {plannedInterventions.length === 0 ? (
                                    <div className="text-center text-slate-400 mt-20 italic">
                                        Click 'AI Generate' to map clinical needs to the Intervention Library.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {plannedInterventions.map((plan) => (
                                            <div key={plan.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">{plan.programName}</h3>
                                                        <Badge variant="secondary" className="text-[10px] mr-2">{plan.category}</Badge>
                                                        {plan.evidenceLevel === 'gold' && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Gold Standard</Badge>}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setPlannedInterventions(prev => prev.filter(p => p.id !== plan.id))}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                
                                                <p className="text-sm text-slate-600 mb-3 italic">"{plan.rationale}"</p>
                                                
                                                <div className="flex gap-4 mb-3 text-xs text-slate-500">
                                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {plan.duration}</span>
                                                    <span className="flex items-center"><Activity className="w-3 h-3 mr-1" /> {plan.frequency}</span>
                                                </div>

                                                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                                                    <div className="font-semibold text-xs text-slate-400 uppercase mb-1">Recommended Steps</div>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {plan.steps.map((step, i) => (
                                                            <li key={i}>{step}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="w-1/3 flex flex-col">
                        <CardHeader>
                            <CardTitle>Referrals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select onValueChange={handleReferralAdd}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Add Referral..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Speech & Language Therapy">Speech & Language Therapy</SelectItem>
                                    <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                                    <SelectItem value="CAMHS (Mental Health)">CAMHS (Mental Health)</SelectItem>
                                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                                    <SelectItem value="Social Care (MASH)">Social Care (MASH)</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="space-y-2 mt-4">
                                {referrals.map((ref, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm">
                                        <span className="text-sm font-medium">{ref}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                            onClick={() => setReferrals(referrals.filter(r => r !== ref))}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                {referrals.length === 0 && (
                                    <div className="text-sm text-slate-400 italic text-center py-4">
                                        No referrals added yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: AI Q&A */}
                <TabsContent value="qa" className="flex-grow mt-0">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Session Q&A</CardTitle>
                            <CardDescription>Ask the AI specific questions about what was discussed.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-4">
                            <div className="flex gap-2">
                                <Textarea 
                                    placeholder="e.g., 'Did the student mention any specific triggers for their anxiety?'" 
                                    className="resize-none"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                />
                                <Button onClick={askFollowUp} disabled={isAsking} className="h-auto w-24">
                                    {isAsking ? "..." : <ArrowRight />}
                                </Button>
                            </div>

                            <ScrollArea className="flex-grow bg-slate-50 rounded-lg p-4 border">
                                {answer ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
                                            <BrainCircuit className="w-4 h-4 text-indigo-500" />
                                            AI Answer:
                                        </div>
                                        <p className="text-slate-800 whitespace-pre-wrap">{answer}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                                        <p>Ask a question to search the transcript context.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
