"use client";

import { useFirestoreCollection, useFirestoreDocument } from "@/hooks/use-firestore";
import { 
  AssessmentAssignment, 
  AssessmentTemplate, 
  AssessmentResult, 
  Question 
} from "@/types/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VoiceInput } from "@/components/ui/voice-input";
import { cn } from "@/lib/utils";

export default function AssessmentRunnerPage() {
  const { id } = useParams() as { id: string }; // Assignment ID
  const router = useRouter();
  const { toast } = useToast();

  // Fetch the assignment first
  const { data: assignment, loading: loadingAssignment } = useFirestoreDocument<AssessmentAssignment>("assessment_assignments", id);
  
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // State for answers
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);

  // Determine Mode
  const isLiveMode = assignment?.mode === 'clinician-live';

  useEffect(() => {
    async function fetchTemplate() {
        if (assignment?.templateId) {
            try {
                const snap = await getDoc(doc(db, "assessment_templates", assignment.templateId));
                if (snap.exists()) {
                    setTemplate(snap.data() as AssessmentTemplate);
                }
            } catch (e) {
                console.error("Failed to load template", e);
            } finally {
                setLoadingTemplate(false);
            }
        } else if (!loadingAssignment && !assignment) {
            setLoadingTemplate(false); // Assignment not found
        }
    }
    fetchTemplate();
  }, [assignment, loadingAssignment]);

  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (isStarted && !isSubmitting) {
          timer = setInterval(() => {
              setElapsedTime(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(timer);
  }, [isStarted, isSubmitting]);

  // Loading States
  if (loadingAssignment || loadingTemplate) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!assignment || !template) {
      return <div className="p-8 text-center">Assessment not found or invalid link.</div>;
  }

  // Branching Logic Filter
  const visibleQuestions = (template.questions || []).filter(q => {
      if (!q.conditions || q.conditions.length === 0) return true;
      
      // Check all conditions (AND logic)
      return q.conditions.every(cond => {
          const dependentAnswer = responses[cond.questionId];
          if (cond.operator === 'equals') {
              return dependentAnswer === cond.value;
          }
          if (cond.operator === 'not_equals') {
              return dependentAnswer !== cond.value;
          }
          return true;
      });
  });

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;

  const handleStart = async () => {
      setIsStarted(true);
      if (assignment.status === 'pending') {
          await updateDoc(doc(db, "assessment_assignments", id), {
              status: 'in-progress',
              startedAt: new Date().toISOString()
          });
      }
  };

  const handleAnswerChange = async (value: any) => {
      setResponses(prev => ({
          ...prev,
          [currentQuestion.id]: value
      }));

      // In Live Mode, auto-save drafts could happen here or debounced
      // For now, client state is sufficient until submit
  };

  const handleNext = () => {
      if (currentQuestion.required && !responses[currentQuestion.id]) {
          toast({ title: "Required", description: "Please answer this question to proceed.", variant: "destructive" });
          return;
      }
      if (currentQuestionIndex < visibleQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
      }
  };

  const handlePrev = () => {
      if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
      }
  };

  const handleSubmit = async () => {
      if (currentQuestion.required && !responses[currentQuestion.id]) {
          toast({ title: "Required", description: "Please answer the final question.", variant: "destructive" });
          return;
      }
      if (!confirm("Are you sure you want to submit your assessment? You cannot change answers after submission.")) return;
      
      setIsSubmitting(true);
      try {
          const resultId = `res_${id}_${Date.now()}`;
          let rawScore = 0; 
          
          const formattedResponses = Object.entries(responses).map(([qId, ans]) => {
              const question = visibleQuestions.find(q => q.id === qId); // Use visible questions only for score? Or map against full list?
              // Map against full template to find question metadata even if hidden (though hidden usually means skipped)
              // Actually, logic dictates we only score visible/answered questions.
              // Let's stick to simple map of what was answered.
              
              const qMeta = template.questions.find(q => q.id === qId);
              let score = 0;
              
              if (qMeta) {
                  if (['multiple-choice', 'yes-no', 'scale'].includes(qMeta.type)) {
                      if (qMeta.correctAnswer === ans) score = qMeta.points;
                      if (qMeta.scoringRules?.weights && qMeta.scoringRules.weights[ans]) {
                          score = qMeta.scoringRules.weights[ans];
                      }
                  }
              }
              
              rawScore += score;
              return {
                  questionId: qId,
                  answer: ans,
                  score: score
              };
          });

          const resultData: AssessmentResult = {
              id: resultId,
              assignmentId: id,
              studentId: assignment.targetId,
              templateId: assignment.templateId,
              startedAt: new Date(Date.now() - elapsedTime * 1000).toISOString(),
              completedAt: new Date().toISOString(),
              responses: formattedResponses,
              totalScore: rawScore, 
              maxScore: visibleQuestions.reduce((acc, q) => acc + q.points, 0), // Calculate max based on what was shown
              status: 'pending-review',
              mode: assignment.mode || 'self'
          };

          await setDoc(doc(db, "assessment_results", resultId), resultData);

          await updateDoc(doc(db, "assessment_assignments", id), {
              status: 'completed',
              completedAt: new Date().toISOString()
          });

          toast({ title: "Submitted", description: "Assessment completed successfully." });
          router.push(`/dashboard/students/${assignment.targetId}`);
      } catch (e: any) {
          console.error(e);
          toast({ title: "Error", description: "Failed to submit assessment.", variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- RENDER HELPERS ---

  const renderQuestionInput = (q: Question) => {
      const value = responses[q.id];

      switch (q.type) {
          case 'multiple-choice':
          case 'yes-no':
              return (
                  <RadioGroup value={value as string} onValueChange={handleAnswerChange} className="space-y-3">
                      {q.type === 'yes-no' && !q.options ? (
                           <>
                            <div className={cn("flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer", isLiveMode && "p-6")}>
                                <RadioGroupItem value="Yes" id="y" className={isLiveMode ? "h-6 w-6" : ""} /><Label htmlFor="y" className={cn("flex-1 cursor-pointer", isLiveMode && "text-xl")}>Yes</Label>
                            </div>
                            <div className={cn("flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer", isLiveMode && "p-6")}>
                                <RadioGroupItem value="No" id="n" className={isLiveMode ? "h-6 w-6" : ""} /><Label htmlFor="n" className={cn("flex-1 cursor-pointer", isLiveMode && "text-xl")}>No</Label>
                            </div>
                           </>
                      ) : (
                          q.options?.map((opt, idx) => (
                              <div key={idx} className={cn("flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer transition-colors", isLiveMode && "p-6")}>
                                  <RadioGroupItem value={opt} id={`${q.id}-${idx}`} className={isLiveMode ? "h-6 w-6" : ""} />
                                  <Label htmlFor={`${q.id}-${idx}`} className={cn("flex-1 cursor-pointer", isLiveMode && "text-xl")}>{opt}</Label>
                              </div>
                          ))
                      )}
                  </RadioGroup>
              );
          case 'short-answer':
              return (
                  <div className="flex gap-2">
                      <Input 
                        placeholder="Type answer..." 
                        value={value as string || ""} 
                        onChange={(e) => handleAnswerChange(e.target.value)} 
                        className={cn("h-12 text-lg", isLiveMode && "h-16 text-xl")}
                      />
                      <VoiceInput 
                        onTranscript={(text) => handleAnswerChange(text)} 
                        currentValue={value as string || ""}
                      />
                  </div>
              );
          case 'essay':
              return (
                  <div className="relative">
                      <Textarea 
                        placeholder="Detailed response..." 
                        value={value as string || ""} 
                        onChange={(e) => handleAnswerChange(e.target.value)} 
                        className={cn("min-h-[200px] text-lg leading-relaxed pr-12", isLiveMode && "text-xl")}
                      />
                      <div className="absolute top-2 right-2">
                           <VoiceInput 
                             onTranscript={(text) => handleAnswerChange(text)} 
                             currentValue={value as string || ""}
                           />
                      </div>
                  </div>
              );
            case 'scale':
                return (
                    <div className="flex justify-between items-center py-8 px-4 flex-wrap gap-4">
                        {(q.options && q.options.length > 0 ? q.options : ['1', '2', '3', '4', '5']).map((opt, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <Button 
                                    variant={value === opt ? "default" : "outline"}
                                    className={cn("h-12 w-12 rounded-full text-lg", isLiveMode && "h-16 w-16 text-2xl")}
                                    onClick={() => handleAnswerChange(opt)}
                                >
                                    {idx + 1}
                                </Button>
                                <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">{opt}</span>
                            </div>
                        ))}
                    </div>
                );
          default:
              return <div className="text-red-500">Unsupported question type: {q.type}</div>;
      }
  };

  // --- MAIN VIEW ---

  if (!isStarted) {
      return (
          <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
              <Card className="max-w-2xl w-full">
                  <CardHeader>
                      <Badge variant="outline" className="w-fit mb-2">{template.category}</Badge>
                      <CardTitle className="text-3xl">{template.title}</CardTitle>
                      <CardDescription className="text-lg mt-2">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {isLiveMode && (
                          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center gap-2 text-indigo-800">
                              <CheckCircle2 className="h-5 w-5" /> 
                              <strong>Clinician Live Mode Enabled:</strong> Optimized for in-session use.
                          </div>
                      )}
                      {assignment.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                          <strong>Note from EPP:</strong> {assignment.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {visibleQuestions.length} Questions</div>
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {template.settings.timeLimit ? `${template.settings.timeLimit} Minutes` : "No Time Limit"}</div>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button size="lg" className={cn("w-full", isLiveMode && "h-16 text-xl")} onClick={handleStart}>
                          {isLiveMode ? "Start Live Session" : "Start Assessment"}
                      </Button>
                  </CardFooter>
              </Card>
          </div>
      );
  }

  // --- LIVE MODE STYLES VS STANDARD ---
  return (
    <div className={cn("min-h-screen flex flex-col bg-muted/20", isLiveMode && "bg-white")}>
      {/* Top Bar */}
      <div className="bg-background border-b sticky top-0 z-10">
          <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
             <div>
                 <h2 className={cn("font-semibold truncate max-w-[200px] md:max-w-md", isLiveMode && "text-lg")}>{template.title}</h2>
                 <div className="text-xs text-muted-foreground">Question {currentQuestionIndex + 1} of {visibleQuestions.length}</div>
             </div>
             <div className="flex items-center gap-4">
                 <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                     {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                 </div>
             </div>
          </div>
          <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-3xl mx-auto px-4 py-8 flex flex-col justify-center">
          <Card className={cn("shadow-lg border-t-4 border-t-primary", isLiveMode && "border-none shadow-none")}>
              <CardHeader>
                  <CardTitle className={cn("text-xl md:text-2xl leading-relaxed", isLiveMode && "text-3xl")}>
                      {currentQuestion.text}
                  </CardTitle>
                  {currentQuestion.helpText && (
                      <CardDescription className={cn(isLiveMode && "text-lg")}>{currentQuestion.helpText}</CardDescription>
                  )}
                  {currentQuestion.required && <Badge variant="secondary" className="w-fit text-[10px]">Required</Badge>}
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                  {renderQuestionInput(currentQuestion)}
              </CardContent>
          </Card>
      </div>

      {/* Footer Navigation */}
      <div className={cn("bg-background border-t p-4", isLiveMode && "p-6")}>
          <div className="container max-w-3xl mx-auto flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentQuestionIndex === 0}
                className={cn("w-28", isLiveMode && "h-14 text-lg")}
              >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              {currentQuestionIndex === visibleQuestions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className={cn("w-32 bg-green-600 hover:bg-green-700", isLiveMode && "h-14 w-40 text-lg")}
                  >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit <Save className="ml-2 h-4 w-4" /></>}
                  </Button>
              ) : (
                  <Button 
                    onClick={handleNext} 
                    className={cn("w-28", isLiveMode && "h-14 text-lg")}
                  >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              )}
          </div>
      </div>
    </div>
  );
}
