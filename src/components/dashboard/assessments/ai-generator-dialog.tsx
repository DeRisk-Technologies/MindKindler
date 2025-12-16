"use client";

import { useState } from "react";
import { Question, QuestionType } from "@/types/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { generateAssessmentQuestions } from "@/ai/flows/generate-assessment-questions";
import { useToast } from "@/hooks/use-toast";

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
    setLoading(true);
    
    try {
      const result = await generateAssessmentQuestions({
          topic,
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          count,
          questionType: type as 'mixed' | 'multiple-choice' | 'essay' | 'audio',
      });

      if (result && result.questions) {
          const formattedQuestions: Question[] = result.questions.map((q: any, i: number) => ({
              id: `ai-${Date.now()}-${i}`,
              type: q.type as QuestionType,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
              hint: q.hint,
              required: true
          }));
          
          onGenerate(formattedQuestions);
          // Reset form
          setTopic("");
          setCount(5);
      } else {
         toast({ title: "Error", description: "AI failed to generate questions.", variant: "destructive" });
      }

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        toast({ title: "Error", description: error.message || "Failed to generate content.", variant: "destructive" });
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
                Describe your assessment needs and let AI draft the questions for you.
             </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label>Topic / Learning Standard</Label>
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
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="easy">Easy (Grade 1-3)</SelectItem>
                          <SelectItem value="medium">Medium (Grade 4-8)</SelectItem>
                          <SelectItem value="hard">Hard (High School+)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
             </div>

             <div className="space-y-2">
                <Label>Question Types</Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mixed">Mixed Types</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice Only</SelectItem>
                        <SelectItem value="essay">Open Ended / Essay</SelectItem>
                        <SelectItem value="audio">Audio/Verbal Focus</SelectItem>
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
