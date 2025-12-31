"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { AssessmentResult, AssessmentTemplate, AssessmentPrivateNote, GuardianFinding, ConsentRecord, RecommendationTemplate } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, BrainCircuit, CheckCircle2, Lock, Save, AlertTriangle, ShieldCheck, ShieldAlert, BookOpen, Wand2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { scoreOpenTextResponse, generateAssessmentSummary } from "@/ai/flows/grading";
import { evaluateEvent } from "@/ai/guardian/engine";
import { GuardianFindingsDialog } from "@/components/dashboard/intelligence/guardian-findings-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { retrieveContext } from "@/ai/knowledge/retrieve";
import { Citations } from "@/components/ui/citations";
import { Checkbox } from "@/components/ui/checkbox";

export default function AssessmentGradingPage() {
  const { id } = useParams() as { id: string }; // Result ID
  const router = useRouter();
  const { toast } = useToast();

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [privateNotes, setPrivateNotes] = useState<AssessmentPrivateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Editable States
  const [edits, setEdits] = useState<Record<string, { score?: number; feedback?: string; aiConf?: string; aiHighlights?: string[] }>>({});
  const [newNote, setNewNote] = useState<Record<string, string>>({}); // Keyed by questionId
  const [summaryDraft, setSummaryDraft] = useState("");

  // Guardian State
  const [guardianFindings, setGuardianFindings] = useState<GuardianFinding[]>([]);
  const [activeConsents, setActiveConsents] = useState<ConsentRecord[]>([]);

  // Evidence State (Phase 3D)
  const [citations, setCitations] = useState<any[]>([]);
  const [enhancing, setEnhancing] = useState(false);

  // Recommendations State (Phase 3D-2)
  const [recommendations, setRecommendations] = useState<RecommendationTemplate[]>([]);
  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
        if (!id) return;
        try {
            // 1. Fetch Result
            const resSnap = await getDoc(doc(db, "assessment_results", id));
            if (resSnap.exists()) {
                const resData = { id: resSnap.id, ...resSnap.data() } as AssessmentResult;
                setResult(resData);
                setSummaryDraft(resData.aiAnalysis || "");

                // 2. Fetch Template
                const tempSnap = await getDoc(doc(db, "assessment_templates", resData.templateId));
                if (tempSnap.exists()) {
                    setTemplate(tempSnap.data() as AssessmentTemplate);
                }

                // 3. Fetch Private Notes
                const notesQuery = query(collection(db, "assessment_private_notes"), where("assessmentResultId", "==", id));
                const notesSnap = await getDocs(notesQuery);
                setPrivateNotes(notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentPrivateNote)));

                // 4. Fetch Consents
                const consentQuery = query(collection(db, "consents"), where("subjectId", "==", resData.studentId), where("status", "==", "granted"));
                const consentSnap = await getDocs(consentQuery);
                setActiveConsents(consentSnap.docs.map(d => ({ id: d.id, ...d.data() } as ConsentRecord)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [id]);

  // Actions

  const handleScoreUpdate = (qId: string, val: number) => {
      setEdits(prev => ({ ...prev, [qId]: { ...prev[qId], score: val } }));
  };

  const handleFeedbackUpdate = (qId: string, val: string) => {
      setEdits(prev => ({ ...prev, [qId]: { ...prev[qId], feedback: val } }));
  };

  const saveQuestionGrading = async (qId: string) => {
      if (!result) return;
      const edit = edits[qId];
      if (!edit) return;

      const updatedResponses = result.responses.map(r => {
          if (r.questionId === qId) {
              return { 
                  ...r, 
                  score: edit.score !== undefined ? edit.score : r.score,
                  feedback: edit.feedback !== undefined ? edit.feedback : r.feedback,
                  aiConfidence: edit.aiConf as any || r.aiConfidence,
                  aiHighlights: edit.aiHighlights || r.aiHighlights
              };
          }
          return r;
      });

      // Recalculate total
      const newTotal = updatedResponses.reduce((acc, r) => acc + (r.score || 0), 0);

      await updateDoc(doc(db, "assessment_results", id), {
          responses: updatedResponses,
          totalScore: newTotal
      });

      // Local update
      setResult(prev => prev ? { ...prev, responses: updatedResponses, totalScore: newTotal } : null);
      toast({ title: "Saved", description: "Grade updated." });
  };

  const triggerAiGrading = async (qId: string, answer: string, maxPoints: number) => {
      setAiLoading(true);
      try {
          // Use our mock service (which would call Genkit in Phase 2)
          const suggestion = await scoreOpenTextResponse(
              template?.questions.find(q => q.id === qId)?.text || "", 
              answer, 
              maxPoints
          );

          // Apply to UI state so EPP can review before saving
          setEdits(prev => ({
              ...prev,
              [qId]: { 
                  score: suggestion.score, 
                  feedback: suggestion.reasoning,
                  aiConf: suggestion.confidence,
                  aiHighlights: suggestion.highlights
              }
          }));
          toast({ title: "AI Suggestion Ready", description: "Review the suggested score and feedback." });
      } catch (e) {
          toast({ title: "Error", description: "AI scoring failed.", variant: "destructive" });
      } finally {
          setAiLoading(false);
      }
  };

  const addPrivateNote = async (qId: string) => {
      const content = newNote[qId];
      if (!content) return;

      try {
          const noteData = {
              assessmentResultId: id,
              questionId: qId,
              authorId: auth.currentUser?.uid || "unknown",
              content,
              createdAt: new Date().toISOString()
          };
          const ref = await addDoc(collection(db, "assessment_private_notes"), noteData);
          setPrivateNotes(prev => [...prev, { id: ref.id, ...noteData }]);
          setNewNote(prev => ({ ...prev, [qId]: "" }));
          toast({ title: "Note Added", description: "Private note saved." });
      } catch (e) {
          console.error(e);
      }
  };

  const generateSummary = async () => {
      if (!template || !result) return;
      setSummaryLoading(true);
      try {
          const formattedResponses = result.responses.map(r => ({
              question: template.questions.find(q => q.id === r.questionId)?.text || "Unknown",
              answer: Array.isArray(r.answer) ? r.answer.join(", ") : r.answer,
              score: r.score
          }));

          const aiRes = await generateAssessmentSummary(template.title, formattedResponses);
          setSummaryDraft(`${aiRes.summary}\n\nRisks:\n- ${aiRes.risks.join("\n- ")}\n\nRecommendations:\n- ${aiRes.recommendations.join("\n- ")}`);
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      } finally {
          setSummaryLoading(false);
      }
  };

  const enhanceWithEvidence = async () => {
      setEnhancing(true);
      try {
          const context = await retrieveContext(summaryDraft, { verifiedOnly: true, includeEvidence: true });
          if (context.length > 0) {
              setCitations(context);
              setSummaryDraft(prev => prev + "\n\n### Evidence References\nThe findings above are supported by verified clinical guidelines and research:");
              toast({ title: "Enhanced", description: "Added evidence citations." });
          } else {
              toast({ title: "No Evidence Found", description: "Try adding more specific keywords." });
          }
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      } finally {
          setEnhancing(false);
      }
  };

  // Phase 3D-2: Recommendations
  const generateRecommendations = async () => {
      setRecLoading(true);
      try {
          // Mock AI: Just fetch all for now and random filter
          // In real app: call cloud function with summary -> vector search on rec templates
          const q = query(collection(db, "recommendationTemplates"));
          const snap = await getDocs(q);
          const allRecs = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecommendationTemplate));
          setRecommendations(allRecs); // Show all available for manual selection in v1
          toast({ title: "Recommendations Generated", description: "Review and select items to add." });
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      } finally {
          setRecLoading(false);
      }
  };

  const createInterventionPlan = async () => {
      if (selectedRecs.length === 0) return;
      if (!result) return;

      try {
          const selectedTemplates = recommendations.filter(r => selectedRecs.includes(r.id));
          
          const planData = {
              tenantId: "default",
              studentId: result.studentId,
              linkedAssessmentId: result.id,
              createdByEppId: auth.currentUser?.uid || "unknown",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'active',
              title: `Intervention Plan - ${template?.title}`,
              goals: ["Based on assessment findings"],
              recommendations: selectedTemplates.map(t => ({
                  recommendationId: t.id,
                  title: t.title,
                  description: t.description,
                  steps: t.steps,
                  evidenceCitations: t.evidenceCitations || [],
                  assignedTo: t.target,
                  startDate: new Date().toISOString(),
                  progressStatus: 'notStarted'
              })),
              reviewDates: [],
              progressLogs: []
          };

          await addDoc(collection(db, "interventionPlans"), planData);
          toast({ title: "Plan Created", description: "Saved to student profile." });
          setSelectedRecs([]);
          setRecommendations([]); // clear list
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      }
  };

  const finalizeAssessment = async () => {
      if (!confirm("Finalize this assessment? This will mark it as 'Graded'.")) return;
      
      // 1. Guardian Check (Real Data)
      const hasAssessmentConsent = activeConsents.some(c => c.consentType === 'assessment');
      
      const findings = await evaluateEvent({
          eventType: 'assessment.finalize',
          tenantId: 'default',
          actorUserId: auth.currentUser?.uid || 'unknown',
          subjectType: 'assessment',
          subjectId: id,
          context: {
              consentObtained: hasAssessmentConsent,
              totalScore: result?.totalScore,
              text: summaryDraft // Check text for safeguarding keywords
          }
      });

      if (findings.length > 0) {
          setGuardianFindings(findings);
          return; // Stop finalize flow (advisory modal will appear)
      }

      // 2. Commit Finalize
      try {
          await updateDoc(doc(db, "assessment_results", id), {
              status: "graded",
              aiAnalysis: summaryDraft,
              completedAt: new Date().toISOString() // Or update reviewedAt
          });
          toast({ title: "Assessment Finalized", description: "Results are now official." });
          router.push(`/dashboard/assessments`);
      } catch (e) {
          console.error(e);
      }
  };

  // Helper to check consent status
  const getConsentStatus = (type: string) => {
      const found = activeConsents.find(c => c.consentType === type);
      return !!found;
  }

  if (loading || !result || !template) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8 pb-20">
      
      <GuardianFindingsDialog 
        findings={guardianFindings} 
        onClose={() => setGuardianFindings([])} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
              <div>
                  <h1 className="text-2xl font-bold">{template.title}</h1>
                  <p className="text-muted-foreground">Student ID: {result.studentId} • Status: <Badge>{result.status}</Badge></p>
              </div>
          </div>
          <div className="text-right">
              <div className="text-3xl font-bold text-primary">{result.totalScore} <span className="text-sm text-muted-foreground font-normal">/ {result.maxScore}</span></div>
              <div className="text-xs text-muted-foreground">Total Score</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Questions & Grading */}
          <div className="lg:col-span-2 space-y-6">
              {template.questions.map((q, idx) => {
                  const response = result.responses.find(r => r.questionId === q.id);
                  const currentScore = edits[q.id]?.score !== undefined ? edits[q.id]?.score : response?.score;
                  const currentFeedback = edits[q.id]?.feedback !== undefined ? edits[q.id]?.feedback : response?.feedback;
                  
                  // Phase 2 AI Data
                  const aiConf = edits[q.id]?.aiConf || response?.aiConfidence;
                  const aiHighlights = edits[q.id]?.aiHighlights || response?.aiHighlights;

                  const notes = privateNotes.filter(n => n.questionId === q.id);

                  return (
                      <Card key={q.id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                  <Badge variant="outline" className="mb-2">Q{idx + 1} • {q.type}</Badge>
                                  <Badge variant="secondary">{currentScore || 0} / {q.points} pts</Badge>
                              </div>
                              <CardTitle className="text-lg">{q.text}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              {/* Answer Display */}
                              <div className="bg-muted/30 p-4 rounded-md border">
                                  <p className="text-sm font-semibold text-muted-foreground mb-1">Student Answer:</p>
                                  <div className="text-lg">
                                      {Array.isArray(response?.answer) ? response?.answer.join(", ") : (response?.answer || "No answer provided")}
                                  </div>
                              </div>
                              
                              {/* AI Confidence Badge */}
                              {aiConf && (
                                  <div className="flex gap-2 items-center">
                                      <Badge variant="outline" className={cn(
                                          aiConf === 'high' ? "border-green-500 text-green-700 bg-green-50" :
                                          aiConf === 'medium' ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                          "border-red-500 text-red-700 bg-red-50"
                                      )}>
                                          AI Confidence: {aiConf.toUpperCase()}
                                      </Badge>
                                      {aiHighlights && aiHighlights.length > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                              Highlights: {aiHighlights.join(", ")}
                                          </span>
                                      )}
                                  </div>
                              )}

                              {/* Grading Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  <div className="space-y-2">
                                      <Label>Score</Label>
                                      <div className="flex gap-2">
                                          <Input 
                                            type="number" 
                                            value={currentScore || 0} 
                                            onChange={(e) => handleScoreUpdate(q.id, Number(e.target.value))}
                                            max={q.points}
                                          />
                                          {/* AI Button for Open Text */}
                                          {(q.type === 'short-answer' || q.type === 'essay') && (
                                              <Button variant="outline" size="icon" onClick={() => triggerAiGrading(q.id, response?.answer as string || "", q.points)} disabled={aiLoading}>
                                                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <BrainCircuit className="h-4 w-4 text-indigo-600"/>}
                                              </Button>
                                          )}
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Feedback (Public)</Label>
                                      <Textarea 
                                        placeholder="Feedback for student..." 
                                        value={currentFeedback || ""} 
                                        onChange={(e) => handleFeedbackUpdate(q.id, e.target.value)}
                                        className="h-[80px]"
                                      />
                                  </div>
                              </div>
                              
                              {/* Actions Bar */}
                              <div className="flex justify-between items-center pt-2 border-t mt-4">
                                  <div className="flex gap-2">
                                      {/* Private Notes Toggle could go here, but inline is easier for phase 1 */}
                                  </div>
                                  <Button size="sm" onClick={() => saveQuestionGrading(q.id)}>
                                      <Save className="h-4 w-4 mr-2" /> Save Grade
                                  </Button>
                              </div>

                              {/* Private Notes Section */}
                              <div className="bg-yellow-50/50 p-3 rounded border border-yellow-100 mt-2">
                                  <div className="flex items-center gap-2 mb-2 text-yellow-800 text-xs font-semibold">
                                      <Lock className="h-3 w-3" /> Private Notes (EPP Only)
                                  </div>
                                  <div className="space-y-2 mb-2">
                                      {notes.map(n => (
                                          <div key={n.id} className="text-xs bg-white p-2 rounded border text-muted-foreground">
                                              {n.content} <span className="opacity-50 text-[10px] ml-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                                          </div>
                                      ))}
                                      {notes.length === 0 && <span className="text-xs text-muted-foreground italic">No notes yet.</span>}
                                  </div>
                                  <div className="flex gap-2">
                                      <Input 
                                        className="h-8 bg-white text-xs" 
                                        placeholder="Add observation..." 
                                        value={newNote[q.id] || ""}
                                        onChange={(e) => setNewNote(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      />
                                      <Button size="sm" variant="ghost" className="h-8" onClick={() => addPrivateNote(q.id)}><CheckCircle2 className="h-4 w-4"/></Button>
                                  </div>
                              </div>

                          </CardContent>
                      </Card>
                  );
              })}
          </div>

          {/* Right: Overall Summary & Actions */}
          <div className="space-y-6">
              <Card className="sticky top-20">
                  <CardHeader>
                      <CardTitle>Assessment Summary</CardTitle>
                      <CardDescription>AI-generated analysis of the session.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {/* Consent Indicator */}
                      <div className="bg-slate-50 border p-3 rounded-lg text-sm space-y-2">
                          <h4 className="font-semibold text-xs uppercase text-muted-foreground">Compliance Checks</h4>
                          <div className="flex justify-between items-center">
                              <span>Data Processing</span>
                              {getConsentStatus('dataProcessing') ? 
                                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200"><ShieldCheck className="w-3 h-3 mr-1"/> Granted</Badge> : 
                                <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1"/> Missing</Badge>
                              }
                          </div>
                          <div className="flex justify-between items-center">
                              <span>Assessment</span>
                              {getConsentStatus('assessment') ? 
                                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200"><ShieldCheck className="w-3 h-3 mr-1"/> Granted</Badge> : 
                                <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1"/> Missing</Badge>
                              }
                          </div>
                      </div>

                      {summaryDraft ? (
                          <>
                            <Textarea 
                                className="min-h-[300px] leading-relaxed" 
                                value={summaryDraft} 
                                onChange={(e) => setSummaryDraft(e.target.value)} 
                            />
                            {/* Evidence Enhancement */}
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={enhanceWithEvidence} disabled={enhancing}>
                                {enhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BookOpen className="mr-2 h-4 w-4"/>}
                                Enhance with Evidence
                            </Button>
                            {citations.length > 0 && <Citations citations={citations} />}
                          </>
                      ) : (
                          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-md bg-muted/20">
                              <p className="text-sm mb-4 text-center px-4">Generate a holistic summary of strengths, risks, and recommendations.</p>
                              <Button variant="outline" onClick={generateSummary} disabled={summaryLoading}>
                                  {summaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4 text-indigo-600"/>}
                                  Generate AI Analysis
                              </Button>
                          </div>
                      )}

                      {/* Recommendations Generation */}
                      <div className="pt-4 border-t space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                              <Wand2 className="h-4 w-4" /> Next Steps
                          </h4>
                          {recommendations.length > 0 ? (
                              <div className="space-y-3">
                                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded p-2">
                                      {recommendations.map(r => (
                                          <div key={r.id} className="flex items-start gap-2 text-sm p-2 hover:bg-muted/50 rounded cursor-pointer">
                                              <Checkbox 
                                                id={r.id} 
                                                checked={selectedRecs.includes(r.id)} 
                                                onCheckedChange={(c) => {
                                                    if (c) setSelectedRecs(prev => [...prev, r.id]);
                                                    else setSelectedRecs(prev => prev.filter(id => id !== r.id));
                                                }}
                                              />
                                              <div className="grid gap-1 leading-none">
                                                  <label htmlFor={r.id} className="font-medium cursor-pointer">{r.title}</label>
                                                  <p className="text-xs text-muted-foreground">{r.description}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                  <Button size="sm" className="w-full" onClick={createInterventionPlan} disabled={selectedRecs.length === 0}>
                                      <Plus className="mr-2 h-4 w-4"/> Create Intervention Plan ({selectedRecs.length})
                                  </Button>
                              </div>
                          ) : (
                              <Button variant="outline" className="w-full" onClick={generateRecommendations} disabled={recLoading}>
                                  {recLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Generate Recommendations"}
                              </Button>
                          )}
                      </div>

                      <div className="pt-4 border-t space-y-3">
                          <Button className="w-full" size="lg" onClick={finalizeAssessment}>
                              Finalize & Publish Results
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                              Finalizing will make the results visible on the student's profile.
                          </p>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
