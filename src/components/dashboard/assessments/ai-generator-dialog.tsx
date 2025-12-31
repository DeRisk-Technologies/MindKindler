"use client";

import { useState } from "react";
import { Question, QuestionType } from "@/types/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles } from "lucide-react";
import { httpsCallable, getFunctions } from "firebase/functions"; // Use Cloud Function
import { useToast } from "@/hooks/use-toast";

const FUNCTIONS_REGION = "europe-west3";

interface AIGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (questions: Question[]) => void;
}

export function AIGeneratorDialog({ open, onOpenChange, onGenerate }: AIGeneratorDialogProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [type, setType] = useState<string>("mixed");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    
    try {
      // FIX: Use Cloud Function instead of client-side flow to avoid key exposure and heavy processing
      const functions = getFunctions(undefined, FUNCTIONS_REGION);
      const generateContent = httpsCallable(functions, 'generateAssessmentContent');
      
      const response: any = await generateContent({
          topic,
          difficulty,
          count,
          questionType: type,
          templateType: 'assessment'
      });

      const result = response.data;

      if (result && result.questions) {
          const formattedQuestions: Question[] = result.questions.map((q: any, i: number) => ({
              id: `ai-${Date.now()}-${i}`,
              type: (q.type || 'short-answer') as QuestionType,
              text: q.text,
              options: q.options || [],
              correctAnswer: q.correctAnswer || "",
              points: q.points || 1,
              hint: q.hint || "",
              required: true
          }));
          
          onGenerate(formattedQuestions);
          setTopic("");
          setCount(5);
      } else {
         throw new Error("Invalid response from AI");
      }

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        // Fallback for demo if cloud function not deployed/fails
        toast({ title: "AI Service Busy", description: "Using offline fallback questions.", variant: "default" });
        
        // Mock fallback
        const fallback: Question[] = [
            { id: 'fb1', type: 'short-answer', text: `Explain the core concepts of ${topic}.`, points: 5, required: true },
            { id: 'fb2', type: 'scale', text: `Rate the student's proficiency in ${topic}.`, points: 1, options: ["Low", "High"], required: true }
        ];
        onGenerate(fallback);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                AI Question Generator
             </DialogTitle>
             <DialogDescription>
                Describe the assessment goal (e.g. "Assess Reading Fluency" or "Evaluate Classroom Behavior") and let AI draft the questions.
             </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label>Topic / Assessment Goal</Label>
                <Textarea 
                   placeholder="e.g. 5th Grade Reading Comprehension about Nature..." 
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Question Count: {count}</Label>
                    <Slider 
                       value={[count]} 
                       onValueChange={(v) => setCount(v[0])} 
                       min={1} 
                       max={10} 
                       step={1} 
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Target Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="easy">Beginner / Primary</SelectItem>
                          <SelectItem value="medium">Intermediate / Middle</SelectItem>
                          <SelectItem value="hard">Advanced / High School</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
             </div>

             <div className="space-y-2">
                <Label>Question Format</Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mixed">Mixed Types</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice Only</SelectItem>
                        <SelectItem value="essay">Open Ended / Observation Notes</SelectItem>
                        <SelectItem value="audio">Audio/Verbal Response</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>

          <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button onClick={handleGenerate} disabled={loading || !topic}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Generating..." : "Generate Draft"}
             </Button>
          </DialogFooter>
       </DialogContent>
    </Dialog>
  );
}
