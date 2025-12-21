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
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AssessmentRunnerPage() {
  const { id } = useParams() as { id: string }; // Assignment ID
  const router = useRouter();
  const { toast } = useToast();

  // Fetch the assignment first
  const { data: assignment, loading: loadingAssignment } = useFirestoreDocument<AssessmentAssignment>("assessment_assignments", id);
  
  // Then fetch the template (dependent query)
  // Note: In a real app, we'd handle this dependent fetching more gracefully.
  // For now, we'll fetch the template only when assignment is loaded.
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // State for answers
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  // Timer (optional implementation)
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    async function fetchTemplate() {
        if (assignment?.templateId) {
            // Manual fetch to avoid hook complexity here
            // In a better architecture, use SWR or React Query
            try {
                const { getDoc, doc } = await import("firebase/firestore");
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

  const questions = template.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleStart = async () => {
      setIsStarted(true);
      // Ideally update assignment status to 'in-progress'
      if (assignment.status === 'pending') {
          await updateDoc(doc(db, "assessment_assignments", id), {
              status: 'in-progress',
              startedAt: serverTimestamp()
          });
      }
  };

  const handleAnswerChange = (value: any) => {
      setResponses(prev => ({
          ...prev,
          [currentQuestion.id]: value
      }));
  };

  const handleNext = () => {
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
      }
  };

  const handlePrev = () => {
      if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
      }
  };

  const handleSubmit = async () => {
      if (!confirm("Are you sure you want to submit your assessment? You cannot change answers after submission.")) return;
      
      setIsSubmitting(true);
      try {
          // 1. Create Result Document
          const resultId = `res_${id}_${Date.now()}`;
          const totalQuestions = questions.length;
          let rawScore = 0; // Basic auto-grading if possible
          
          const formattedResponses = Object.entries(responses).map(([qId, ans]) => {
              const question = questions.find(q => q.id === qId);
              let score = 0;
              // Simple auto-grading for MC/TF
              if (question && (question.type === 'multiple-choice' || question.type === 'true-false')) {
                  if (question.correctAnswer === ans) {
                      score = question.points;
                      rawScore += score;
                  }
              }
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
              totalScore: rawScore, // Provisional
              maxScore: questions.reduce((acc, q) => acc + q.points, 0),
              status: 'pending-review' // Assume manual review needed for essays etc.
          };

          await setDoc(doc(db, "assessment_results", resultId), resultData);

          // 2. Update Assignment Status
          await updateDoc(doc(db, "assessment_assignments", id), {
              status: 'completed',
              completedAt: serverTimestamp()
          });

          toast({ title: "Submitted", description: "Assessment completed successfully." });
          router.push(`/dashboard/assessments/analytics`); // Redirect to somewhere useful
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
          case 'true-false':
              return (
                  <RadioGroup value={value as string} onValueChange={handleAnswerChange} className="space-y-3">
                      {q.options?.map((opt, idx) => (
                          <div key={idx} className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                              <RadioGroupItem value={opt} id={`${q.id}-${idx}`} />
                              <Label htmlFor={`${q.id}-${idx}`} className="flex-1 cursor-pointer">{opt}</Label>
                          </div>
                      ))}
                      {!q.options && q.type === 'true-false' && (
                           <>
                            <div className="flex items-center space-x-2 border p-4 rounded-md"><RadioGroupItem value="True" id="t" /><Label htmlFor="t">True</Label></div>
                            <div className="flex items-center space-x-2 border p-4 rounded-md"><RadioGroupItem value="False" id="f" /><Label htmlFor="f">False</Label></div>
                           </>
                      )}
                  </RadioGroup>
              );
          case 'short-answer':
              return (
                  <Input 
                    placeholder="Type your answer here..." 
                    value={value as string || ""} 
                    onChange={(e) => handleAnswerChange(e.target.value)} 
                    className="h-12 text-lg"
                  />
              );
          case 'essay':
              return (
                  <Textarea 
                    placeholder="Type your detailed response here..." 
                    value={value as string || ""} 
                    onChange={(e) => handleAnswerChange(e.target.value)} 
                    className="min-h-[200px] text-lg leading-relaxed"
                  />
              );
            case 'scale':
                // Simple scale 1-5 or 1-10 if not defined
                const max = 5; 
                return (
                    <div className="flex justify-between items-center py-8 px-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num} className="flex flex-col items-center gap-2">
                                <Button 
                                    variant={value === num.toString() ? "default" : "outline"}
                                    className="h-12 w-12 rounded-full text-lg"
                                    onClick={() => handleAnswerChange(num.toString())}
                                >
                                    {num}
                                </Button>
                                <span className="text-xs text-muted-foreground">{num === 1 ? "Low" : num === 5 ? "High" : ""}</span>
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {questions.length} Questions</div>
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {template.settings.timeLimit ? `${template.settings.timeLimit} Minutes` : "No Time Limit"}</div>
                          <div className="flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Single Attempt</div>
                      </div>
                      <div className="text-sm">
                          <strong>Instructions:</strong> Please read each question carefully. You can navigate back to change answers before submitting if allowed.
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button size="lg" className="w-full" onClick={handleStart}>Start Assessment</Button>
                  </CardFooter>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Top Bar */}
      <div className="bg-background border-b sticky top-0 z-10">
          <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
             <div>
                 <h2 className="font-semibold truncate max-w-[200px] md:max-w-md">{template.title}</h2>
                 <div className="text-xs text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</div>
             </div>
             <div className="flex items-center gap-4">
                 <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                     {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                 </div>
                 {/* <Button variant="ghost" size="sm">Save & Exit</Button> */}
             </div>
          </div>
          <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-3xl mx-auto px-4 py-8 flex flex-col justify-center">
          <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                  <CardTitle className="text-xl md:text-2xl leading-relaxed">
                      {currentQuestion.text}
                  </CardTitle>
                  {currentQuestion.hint && (
                      <CardDescription className="italic text-sm">Hint: {currentQuestion.hint}</CardDescription>
                  )}
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                  {renderQuestionInput(currentQuestion)}
              </CardContent>
          </Card>
      </div>

      {/* Footer Navigation */}
      <div className="bg-background border-t p-4">
          <div className="container max-w-3xl mx-auto flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentQuestionIndex === 0}
                className="w-28"
              >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <div className="flex gap-2">
                {/* Optional 'Review' button logic could go here */}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="w-32 bg-green-600 hover:bg-green-700"
                  >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit <Save className="ml-2 h-4 w-4" /></>}
                  </Button>
              ) : (
                  <Button 
                    onClick={handleNext} 
                    className="w-28"
                  >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              )}
          </div>
      </div>
    </div>
  );
}
