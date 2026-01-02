"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { AssessmentTemplate, Question, QuestionType } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical, Save, ArrowLeft, CheckCircle2, GitBranch, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore"; // Import updateDoc and getDoc
import { db, auth } from "@/lib/firebase";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AIGeneratorDialog } from "@/components/dashboard/assessments/ai-generator-dialog";

// Predefined Categories
const CATEGORIES = [
  "Learning difficulties / academic performance",
  "Attention & executive function",
  "Autism spectrum / neurodiversity screening",
  "Behavioural & emotional wellbeing",
  "Social skills and peer interaction",
  "Bullying / trauma / safeguarding",
  "School environment / systemic issues",
  "Parenting & home environment",
  "Teacher classroom management context",
  "Risk triage / urgent referral screening",
  "Staff competence and training needs",
  "Other"
];

const QUESTION_TYPES: { type: QuestionType; label: string }[] = [
  { type: "multiple-choice", label: "Multiple Choice (Single)" },
  // { type: "multiple-choice-multi", label: "Multiple Choice (Multi)" }, // Need to update schema or handle in UI logic
  { type: "yes-no", label: "Yes / No" },
  { type: "short-answer", label: "Short Answer" },
  { type: "essay", label: "Open Text (Long)" },
  { type: "scale", label: "Likert Scale (1-5)" },
];

export default function AssessmentBuilderPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'ai') {
      setIsAiDialogOpen(true);
    }
  }, [searchParams]);

  const handleAiDialogClose = (open: boolean) => {
    setIsAiDialogOpen(open);
    if (!open) {
      router.back();
    }
  };

  const handleAiGenerate = (generatedQuestions: Question[]) => {
    setQuestions(prevQuestions => [...prevQuestions, ...generatedQuestions]);
    setIsAiDialogOpen(false);
    router.replace('/dashboard/assessments/builder'); // Remove mode=ai from URL
    toast({
        title: "AI Draft Generated",
        description: "Review and edit the questions as needed."
    });
  };
  
  // Builder State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [targetType, setTargetType] = useState<"Student" | "Parent" | "Teacher" | "School" | "Mixed">("Student");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const id = searchParams.get('id');
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchAssessment = async () => {
        const docRef = doc(db, "assessment_templates", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AssessmentTemplate;
          setTitle(data.title);
          setDescription(data.description || "");
          setCategory(data.category || CATEGORIES[0]);
          setTargetType(data.targetType || "Student");
          setQuestions(data.questions || []);
        } else {
          toast({ title: "Not Found", description: "Assessment template not found.", variant: "destructive" });
          router.push("/dashboard/assessments");
        }
      };
      fetchAssessment();
    }
  }, [id, isEditMode, router, toast]);

  // Helper to add a new question block
  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: "multiple-choice",
      text: "",
      required: true,
      points: 1,
      options: ["Option 1", "Option 2"],
      scoringRules: { weights: {} },
      conditions: []
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: string, idx: number, val: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = [...(q.options || [])];
      newOpts[idx] = val;
      return { ...q, options: newOpts };
    }));
  };

  const addOption = (qId: string) => {
     setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] };
    }));
  };
  
  const removeOption = (qId: string, idx: number) => {
      setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = [...(q.options || [])];
      newOpts.splice(idx, 1);
      return { ...q, options: newOpts };
    }));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Branching Logic Helpers
  const addCondition = (qId: string) => {
      setQuestions(questions.map(q => {
          if (q.id !== qId) return q;
          return {
              ...q,
              conditions: [
                  ...(q.conditions || []),
                  { questionId: "", operator: "equals", value: "" }
              ]
          };
      }));
  };

  const updateCondition = (qId: string, condIdx: number, field: string, val: any) => {
      setQuestions(questions.map(q => {
          if (q.id !== qId) return q;
          const newConds = [...(q.conditions || [])];
          newConds[condIdx] = { ...newConds[condIdx], [field]: val };
          return { ...q, conditions: newConds };
      }));
  };

  const removeCondition = (qId: string, condIdx: number) => {
      setQuestions(questions.map(q => {
          if (q.id !== qId) return q;
          const newConds = [...(q.conditions || [])];
          newConds.splice(condIdx, 1);
          return { ...q, conditions: newConds };
      }));
  };

  const handleSave = async () => {
    if (!title) {
      toast({ title: "Missing Title", description: "Please enter a title for the assessment.", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "No Questions", description: "Please add at least one question.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        title,
        description,
        category,
        targetType,
        questions,
        updatedAt: new Date().toISOString(),
        status: "published",
        settings: {
          allowBacktracking: true,
          shuffleQuestions: false
        }
      };
      
      if (isEditMode && id) {
        const docRef = doc(db, "assessment_templates", id);
        await updateDoc(docRef, { ...templateData });
        toast({ title: "Assessment Updated", description: "Template updated successfully." });
      } else {
        await addDoc(collection(db, "assessment_templates"), {
            ...templateData,
            createdBy: auth.currentUser?.uid || "system",
            createdAt: new Date().toISOString()
        });
        toast({ title: "Assessment Saved", description: "Template published successfully." });
      }

      router.push("/dashboard/assessments");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <AIGeneratorDialog
        open={isAiDialogOpen}
        onOpenChange={handleAiDialogClose}
        onGenerate={handleAiGenerate}
      />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{isEditMode ? "Edit Assessment" : "Assessment Builder"}</h1>
          <p className="text-muted-foreground">{isEditMode ? "Modify an existing assessment template." : "Design a new assessment template."}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Basic information and categorization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input placeholder="e.g., Early Reading Skills Assessment" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea placeholder="Instructions for the participant..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Target Audience</Label>
              <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="School">School</SelectItem>
                  <SelectItem value="Mixed">Mixed / General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="relative group border-l-4 border-l-indigo-500">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => deleteQuestion(q.id)}>
                 <Trash2 className="h-4 w-4" />
               </Button>
            </div>
            
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">
                  {idx + 1}
                </Badge>
                <div className="flex-1 grid gap-2">
                  <Input 
                    className="font-medium text-lg border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary" 
                    placeholder="Enter question text..." 
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-10">
                <div className="grid gap-2">
                  <Label className="text-xs">Question Type</Label>
                  <Select value={q.type} onValueChange={(val) => updateQuestion(q.id, "type", val)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                   <Label className="text-xs">Points (Max Score)</Label>
                   <Input 
                     type="number" 
                     className="h-8" 
                     value={q.points} 
                     onChange={(e) => updateQuestion(q.id, "points", parseInt(e.target.value))} 
                   />
                </div>
                <div className="flex items-center gap-2 pt-6">
                   <Switch 
                    checked={q.required} 
                    onCheckedChange={(checked) => updateQuestion(q.id, "required", checked)} 
                   />
                   <Label className="text-sm">Required</Label>
                </div>
              </div>

              {/* Options Editor for Choice/Scale types */}
              {(q.type === 'multiple-choice' || q.type === 'scale') && (
                <div className="pl-10 space-y-2">
                   <Label className="text-xs font-semibold text-muted-foreground">Options</Label>
                   {q.options?.map((opt, optIdx) => (
                     <div key={optIdx} className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                       <Input 
                         value={opt} 
                         onChange={(e) => updateOption(q.id, optIdx, e.target.value)} 
                         className="h-8 flex-1"
                       />
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeOption(q.id, optIdx)}>
                         <Trash2 className="h-3 w-3 text-muted-foreground" />
                       </Button>
                     </div>
                   ))}
                   <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => addOption(q.id)}>
                     <Plus className="h-3 w-3 mr-1" /> Add Option
                   </Button>
                </div>
              )}
              
               {/* Read-only preview for text types */}
               {(q.type === 'short-answer' || q.type === 'essay') && (
                  <div className="pl-10">
                    <div className="h-10 w-full border border-dashed rounded bg-muted/20 flex items-center px-3 text-sm text-muted-foreground italic">
                      User will type answer here...
                    </div>
                  </div>
               )}

               {/* Branching Logic UI */}
               <div className="pl-10 pt-2">
                   <Popover>
                       <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                               <GitBranch className="h-3 w-3 mr-1" /> 
                               {q.conditions && q.conditions.length > 0 ? `${q.conditions.length} Active Condition(s)` : "Add Logic Condition"}
                           </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-96 p-4">
                           <div className="space-y-4">
                               <h4 className="font-medium text-sm border-b pb-2">Show this question ONLY if:</h4>
                               {q.conditions?.map((cond, cIdx) => (
                                   <div key={cIdx} className="flex items-center gap-2 text-sm">
                                       <Select 
                                         value={cond.questionId} 
                                         onValueChange={(val) => updateCondition(q.id, cIdx, "questionId", val)}
                                       >
                                           <SelectTrigger className="w-[120px] h-8"><SelectValue placeholder="Question" /></SelectTrigger>
                                           <SelectContent>
                                               {questions.slice(0, idx).map(prevQ => (
                                                   <SelectItem key={prevQ.id} value={prevQ.id}>
                                                       {prevQ.text.substring(0, 15)}...
                                                   </SelectItem>
                                               ))}
                                           </SelectContent>
                                       </Select>
                                       
                                       <span className="text-xs text-muted-foreground">is</span>
                                       
                                       <Input 
                                         className="h-8 flex-1" 
                                         placeholder="Value (e.g., Yes)" 
                                         value={cond.value as string}
                                         onChange={(e) => updateCondition(q.id, cIdx, "value", e.target.value)}
                                       />

                                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCondition(q.id, cIdx)}>
                                           <X className="h-3 w-3" />
                                       </Button>
                                   </div>
                               ))}
                               <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => addCondition(q.id)}>
                                   <Plus className="h-3 w-3 mr-1" /> Add Rule
                               </Button>
                           </div>
                       </PopoverContent>
                   </Popover>
               </div>

            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full py-8 border-dashed" onClick={addQuestion}>
           <Plus className="mr-2 h-5 w-5" /> Add New Question
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10 flex justify-end gap-4 shadow-lg md:pl-64">
         <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
         <Button onClick={handleSave} disabled={isSaving} className="w-32">
           {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Update' : 'Publish'}</>}
         </Button>
      </div>
    </div>
  );
}
