// src/components/consultations/PostSessionSynthesis.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, AlertTriangle, FileText, ArrowRight, 
    Sparkles, Edit3, MessageSquare, Plus, Trash2,
    Clock, Activity, BrainCircuit, Save, X, Highlighter, Send, BookmarkPlus
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
import { Input } from '@/components/ui/input'; 

import { askSessionQuestionAction, AiInsight } from '@/app/actions/consultation';
import { generateInterventionPlanAction, PlannedIntervention } from '@/app/actions/intervention';
import { SessionTimeline } from './analysis/SessionTimeline'; 
import { ReferralGeneratorModal } from '@/components/reporting/modals/ReferralGeneratorModal'; 

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
    manualClinicalNotes?: string[];
}

interface PostSessionSynthesisProps {
    sessionId: string;
    transcript: string;
    initialInsights: AiInsight[];
    student: Partial<StudentRecord>;
    assessments?: AssessmentResult[];
    
    // Restored State Props
    initialManualNotes?: string[];
    initialPlannedInterventions?: PlannedIntervention[];
    initialReferrals?: string[];
    initialPromotedEvidence?: string[];

    onComplete: (data: SynthesisResult) => void; 
    onSave?: (data: SynthesisResult) => void;
}

export function PostSessionSynthesis({ 
    sessionId, 
    transcript, 
    initialInsights, 
    student,
    assessments = [], 
    initialManualNotes = [],
    initialPlannedInterventions = [],
    initialReferrals = [],
    initialPromotedEvidence = [],
    onComplete,
    onSave
}: PostSessionSynthesisProps) {
    const { toast } = useToast();
    
    // State
    const [activeTab, setActiveTab] = useState('review');
    const [clinicalOpinions, setClinicalOpinions] = useState<AiInsight[]>(initialInsights);
    const [manualOpinions, setManualOpinions] = useState<string[]>(initialManualNotes);
    const [newManualOpinion, setNewManualOpinion] = useState("");
    
    const [plannedInterventions, setPlannedInterventions] = useState<PlannedIntervention[]>(initialPlannedInterventions);
    const [referrals, setReferrals] = useState<string[]>(initialReferrals);
    const [editedTranscript, setEditedTranscript] = useState(transcript); 
    const [promotedEvidence, setPromotedEvidence] = useState<string[]>(initialPromotedEvidence);
    
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Q&A State
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isAsking, setIsAsking] = useState(false);

    // Referral Modal State
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

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

    const addManualOpinion = () => {
        if (!newManualOpinion.trim()) return;
        setManualOpinions([...manualOpinions, newManualOpinion]);
        setNewManualOpinion("");
    };

    const removeManualOpinion = (idx: number) => {
        setManualOpinions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleTextSelect = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 5) {
            const text = selection.toString();
            setPromotedEvidence(prev => [...prev, text]);
            toast({ title: "Evidence Promoted", description: "Added to clinical context." });
        }
    };
    
    // New: Q&A Text Selection Handler
    const handleQASelect = () => {
         const selection = window.getSelection();
         if (selection && selection.toString().length > 5) {
             const text = selection.toString();
             setPromotedEvidence(prev => [...prev, `Q&A Excerpt: ${text}`]);
             toast({ title: "Evidence Promoted", description: "Selected Q&A text added to clinical context." });
         }
    };

    const generateTreatmentPlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const cleanStudent = sanitizeForServer(student);
            const cleanAssessments = sanitizeForServer(assessments);
            const confirmedOpinions = clinicalOpinions.filter(op => (op as any).confirmed);

            const context = {
                transcript: editedTranscript, 
                student: cleanStudent,
                assessments: cleanAssessments,
                clinicalOpinions: confirmedOpinions, 
                manualEntries: [...manualOpinions, ...promotedEvidence], 
                availableInterventions: MOCK_UK_LIBRARY,
                region: 'UK' 
            };
            
            const plans = await generateInterventionPlanAction(context);
            if (!plans || plans.length === 0) {
                 toast({ title: "No Plans Generated", description: "AI returned no matches. Try adding more notes.", variant: "warning" });
            } else {
                 setPlannedInterventions(plans);
                 toast({ title: "Plan Generated", description: `Created ${plans.length} targeted interventions.` });
            }
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

    const promoteAnswerToEvidence = () => {
        if (answer) {
            setPromotedEvidence(prev => [...prev, `AI Insight: ${answer}`]);
            toast({ title: "Promoted to Evidence", description: "AI Answer added to findings." });
        }
    };
    
    const handleSaveProgress = async () => {
        if (onSave) {
            setIsSaving(true);
            const synthesisResult: SynthesisResult = {
                confirmedOpinions: clinicalOpinions, // Save all, including unconfirmed state
                plannedInterventions,
                referrals,
                editedTranscript,
                reportType: 'custom', 
                manualClinicalNotes: [...manualOpinions, ...promotedEvidence] // Combine for storage, but we might want to split them on restore if possible. For now, this is okay.
            };
            await onSave(synthesisResult);
            setIsSaving(false);
            toast({ title: "Progress Saved", description: "Session state updated." });
        }
    };

    const handleDraftReport = (type: 'statutory' | 'custom') => {
        const synthesisResult: SynthesisResult = {
            confirmedOpinions: clinicalOpinions.filter(op => (op as any).confirmed), 
            plannedInterventions,
            referrals,
            editedTranscript,
            reportType: type,
            manualClinicalNotes: [...manualOpinions, ...promotedEvidence]
        };
        onComplete(synthesisResult);
    };

    const mockTimelineEvents = initialInsights.map((insight, i) => ({
        timestamp: new Date(Date.now() - (1000 * 60 * (10 - i))),
        type: 'insight' as const,
        label: insight.type
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6">
            
            {/* Modal */}
            <ReferralGeneratorModal 
                isOpen={isReferralModalOpen} 
                onClose={() => setIsReferralModalOpen(false)}
                sessionId={sessionId}
                studentName={student.identity?.firstName?.value || 'Student'}
                context={{ clinicalOpinions, promotedEvidence }}
            />

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Post-Session Synthesis</h1>
                    <p className="text-slate-500 text-sm">Review timeline, triangulate findings, and plan interventions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleSaveProgress} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Progress"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsReferralModalOpen(true)}>
                        <Send className="mr-2 h-4 w-4" /> Generate Referral
                    </Button>
                    <Button onClick={() => handleDraftReport('statutory')} className="bg-indigo-600 hover:bg-indigo-700">
                        <FileText className="mr-2 h-4 w-4" /> Draft Statutory Report
                    </Button>
                </div>
            </div>

            <SessionTimeline events={mockTimelineEvents} durationMs={1000 * 60 * 15} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4">
                    <TabsTrigger value="review" className="px-6 py-2">1. Clinical Review</TabsTrigger>
                    <TabsTrigger value="plan" className="px-6 py-2">2. Treatment Plan</TabsTrigger>
                    <TabsTrigger value="qa" className="px-6 py-2">3. AI Q&A</TabsTrigger>
                </TabsList>

                {/* Tab 1: Clinical Review */}
                <TabsContent value="review" className="flex-grow flex gap-6 mt-0">
                    <Card className="w-1/2 flex flex-col">
                        <CardHeader className="py-3 bg-slate-50 border-b">
                            <CardTitle className="text-sm font-semibold flex justify-between items-center">
                                Transcript Review
                                <Badge variant="outline" className="text-[10px]">Select text to promote</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow p-0 relative">
                            <Textarea 
                                className="h-full resize-none font-mono text-sm leading-relaxed p-4 focus-visible:ring-indigo-500 border-none"
                                value={editedTranscript}
                                onChange={(e) => setEditedTranscript(e.target.value)} 
                                onMouseUp={handleTextSelect} 
                            />
                        </CardContent>
                    </Card>

                    <div className="w-1/2 flex flex-col gap-4">
                        <Card className="flex-grow bg-white border-indigo-100 shadow-sm">
                            <CardHeader className="py-3 border-b bg-indigo-50/50">
                                <CardTitle className="text-sm font-semibold text-indigo-900 flex items-center">
                                    <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                                    Triangulated Findings
                                </CardTitle>
                            </CardHeader>
                            <ScrollArea className="flex-grow h-[300px] px-4 py-2">
                                <div className="space-y-4">
                                    {promotedEvidence.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase">Transcript Evidence</h4>
                                            {promotedEvidence.map((text, i) => (
                                                <div key={i} className="p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-900 italic">
                                                    "{text}"
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">AI Hypotheses</h4>
                                        {clinicalOpinions.map((insight) => (
                                            <div 
                                                key={insight.id} 
                                                className={`p-3 rounded border cursor-pointer transition-all ${
                                                    (insight as any).confirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-300'
                                                }`}
                                                onClick={() => toggleConfirmation(insight.id)}
                                            >
                                                <div className="flex justify-between mb-1">
                                                    <Badge variant="secondary" className="text-[10px] uppercase">{insight.type}</Badge>
                                                    {(insight as any).confirmed && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                                </div>
                                                <p className="text-xs text-slate-700">{insight.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </Card>

                        <Card className="h-1/3">
                            <CardHeader className="py-2"><CardTitle className="text-xs">Manual Notes</CardTitle></CardHeader>
                            <CardContent className="p-2">
                                <ScrollArea className="h-24 mb-2">
                                    {manualOpinions.map((note, i) => (
                                        <div key={i} className="text-xs p-1 border-b flex justify-between group">
                                            <span>{note}</span>
                                            <X className="w-3 h-3 text-slate-300 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => removeManualOpinion(i)}/>
                                        </div>
                                    ))}
                                </ScrollArea>
                                <div className="flex gap-2">
                                    <Input className="h-7 text-xs" placeholder="Add observation..." value={newManualOpinion} onChange={e => setNewManualOpinion(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManualOpinion()}/>
                                    <Button size="sm" variant="secondary" className="h-7" onClick={addManualOpinion}><Plus className="w-3 h-3"/></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Treatment Plan */}
                <TabsContent value="plan" className="flex-grow flex gap-6 mt-0">
                    <Card className="w-2/3 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Intervention Plan</CardTitle>
                                <CardDescription>Smart-mapped from WISC-V Scores, Session Evidence & Your Notes.</CardDescription>
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
                                            <div key={plan.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">{plan.programName}</h3>
                                                        <Badge variant="secondary" className="text-[10px] mr-2">{plan.category}</Badge>
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
                        <CardHeader><CardTitle>Referrals</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Select onValueChange={handleReferralAdd}>
                                <SelectTrigger><SelectValue placeholder="Add Referral..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Speech & Language Therapy">Speech & Language Therapy</SelectItem>
                                    <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                                    <SelectItem value="CAMHS (Mental Health)">CAMHS (Mental Health)</SelectItem>
                                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                                    <SelectItem value="Social Care (MASH)">Social Care (MASH)</SelectItem>
                                    <SelectItem value="SENCO (School Counselor)">SENCO (School Counselor)</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="space-y-2 mt-4">
                                {referrals.map((ref, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm">
                                        <span className="text-sm font-medium">{ref}</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => setReferrals(referrals.filter(r => r !== ref))}>×</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: AI Q&A (Enhanced) */}
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

                            <ScrollArea className="flex-grow bg-slate-50 rounded-lg p-4 border" onMouseUp={handleQASelect}>
                                {answer ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="flex items-center justify-between gap-2 font-bold text-slate-700 mb-2">
                                            <div className="flex items-center gap-2">
                                                <BrainCircuit className="w-4 h-4 text-indigo-500" />
                                                AI Answer:
                                            </div>
                                            {/* Phase 35: Promote Button */}
                                            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={promoteAnswerToEvidence}>
                                                <BookmarkPlus className="w-3 h-3 mr-1" /> Use as Evidence
                                            </Button>
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
