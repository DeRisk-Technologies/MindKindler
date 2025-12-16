"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AssessmentTemplate, Question } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Mic, Video } from "lucide-react";

export default function StudentAssessmentPortal() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "assessment_templates", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTemplate({ id: docSnap.id, ...docSnap.data() } as AssessmentTemplate);
        } else {
          toast({ title: "Error", description: "Assessment not found", variant: "destructive" });
        }
      } catch (error) {
        console.error("Fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleResponse = (qId: string, value: any) => {
    setResponses(prev => ({ ...prev, [qId]: value }));
  };

  const handleNext = () => {
    if (currentStep < (template?.questions.length || 0) - 1) {
       setCurrentStep(prev => prev + 1);
    } else {
       handleSubmit();
    }
  };

  const handleBack = () => {
     if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
     if (!template) return;
     setSubmitting(true);
     
     // Calculate auto-score
     let autoScore = 0;
     let maxScore = 0;

     template.questions.forEach(q => {
        maxScore += q.points;
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
            if (responses[q.id] === q.correctAnswer) {
                autoScore += q.points;
            }
        }
     });

     try {
        await addDoc(collection(db, "assessment_results"), {
            templateId: template.id,
            studentId: "current_student_id", // In real app, from auth context
            responses,
            totalScore: autoScore,
            maxScore,
            status: "pending-review", // Flag for AI/EPP review
            startedAt: new Date().toISOString(), // approximation
            completedAt: serverTimestamp()
        });
        setCompleted(true);
     } catch (err) {
        toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
     } finally {
        setSubmitting(false);
     }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!template) return <div className="p-8 text-center">Assessment not found.</div>;
  if (completed) return (
      <div className="flex flex-col justify-center items-center h-screen p-4 text-center space-y-4 bg-muted/20">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold">Assessment Completed!</h1>
          <p className="text-muted-foreground">Thank you for your responses. Your results have been submitted.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
      </div>
  );

  const currentQuestion = template.questions[currentStep];
  const progress = ((currentStep + 1) / template.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex justify-center items-start pt-12">
        <div className="w-full max-w-2xl space-y-6">
            <div className="space-y-2">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{template.title}</h1>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">Question {currentStep + 1} of {template.questions.length}</p>
            </div>

            <Card className="min-h-[400px] flex flex-col shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg leading-relaxed">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                    {/* Render Input based on Type */}
                    {currentQuestion.type === 'multiple-choice' && (
                        <RadioGroup value={responses[currentQuestion.id] || ""} onValueChange={(val) => handleResponse(currentQuestion.id, val)}>
                            {currentQuestion.options?.map((opt, i) => (
                                <div key={i} className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${responses[currentQuestion.id] === opt ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                                    <RadioGroupItem value={opt} id={`${currentQuestion.id}-${i}`} />
                                    <Label htmlFor={`${currentQuestion.id}-${i}`} className="flex-1 cursor-pointer font-normal text-base">{opt}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {currentQuestion.type === 'true-false' && (
                        <RadioGroup value={responses[currentQuestion.id] || ""} onValueChange={(val) => handleResponse(currentQuestion.id, val)}>
                            <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer">
                                <RadioGroupItem value="true" id="true" />
                                <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                            </div>
                            <div className="flex items-center space-x-3 border p-4 rounded-lg cursor-pointer">
                                <RadioGroupItem value="false" id="false" />
                                <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                            </div>
                        </RadioGroup>
                    )}

                    {currentQuestion.type === 'short-answer' && (
                        <Input 
                            placeholder="Type your answer..." 
                            value={responses[currentQuestion.id] || ""} 
                            onChange={(e) => handleResponse(currentQuestion.id, e.target.value)} 
                            className="h-12 text-lg"
                        />
                    )}

                    {currentQuestion.type === 'essay' && (
                        <Textarea 
                            placeholder="Type your detailed response..." 
                            value={responses[currentQuestion.id] || ""} 
                            onChange={(e) => handleResponse(currentQuestion.id, e.target.value)} 
                            className="min-h-[200px] text-base"
                        />
                    )}

                     {currentQuestion.type === 'audio-response' && (
                        <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-50">
                             <Mic className="h-12 w-12 text-slate-400" />
                             <p className="text-sm text-muted-foreground">Audio recording will be enabled in production</p>
                             <Button variant="outline">Start Recording</Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={!responses[currentQuestion.id] && currentQuestion.required}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {currentStep === template.questions.length - 1 ? (submitting ? "Submitting..." : "Submit Assessment") : "Next Question"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
