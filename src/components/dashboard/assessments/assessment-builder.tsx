"use client";

import { useState } from "react";
import { Question, AssessmentTemplate, QuestionType } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Save, Plus, GripVertical, Trash2, Eye, Layout, Image as ImageIcon, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QuestionBlock } from "./question-block";
import { AssessmentPreview } from "./assessment-preview";
import { AIGeneratorDialog } from "./ai-generator-dialog";

interface AssessmentBuilderProps {
  initialMode?: 'manual' | 'ai';
  existingTemplate?: AssessmentTemplate;
}

export function AssessmentBuilder({ initialMode = 'manual', existingTemplate }: AssessmentBuilderProps) {
  const [title, setTitle] = useState(existingTemplate?.title || "Untitled Assessment");
  const [description, setDescription] = useState(existingTemplate?.description || "");
  const [category, setCategory] = useState(existingTemplate?.category || "General");
  const [questions, setQuestions] = useState<Question[]>(existingTemplate?.questions || []);
  const [activeTab, setActiveTab] = useState("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [showAI, setShowAI] = useState(initialMode === 'ai');
  
  const { toast } = useToast();

  const addQuestion = (type: QuestionType = 'multiple-choice') => {
    const newQ: Question = {
      id: Date.now().toString(),
      type,
      text: "",
      options: type === 'multiple-choice' || type === 'scale' ? ["Option 1", "Option 2"] : undefined,
      points: 1,
      required: true
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const templateData = {
        title,
        description,
        category,
        questions,
        createdBy: "current_user_id", // Replace with auth context
        createdAt: existingTemplate ? existingTemplate.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft',
        settings: {
          allowBacktracking: true,
          shuffleQuestions: false
        }
      };

      // In real app: check if updating or creating
      await addDoc(collection(db, "assessment_templates"), templateData);
      
      toast({ title: "Success", description: "Assessment template saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIResults = (generatedQuestions: Question[]) => {
      setQuestions([...questions, ...generatedQuestions]);
      setShowAI(false);
      toast({ title: "Generated", description: `Added ${generatedQuestions.length} questions.` });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold tracking-tight">Assessment Designer</h1>
           <p className="text-muted-foreground">Build assessments manually or with AI assistance.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAI(true)}>
               <BrainCircuit className="mr-2 h-4 w-4" /> AI Generator
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
               <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Template"}
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Sidebar: Settings */}
         <div className="md:col-span-1 space-y-4">
            <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Settings</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Reading">Reading</SelectItem>
                          <SelectItem value="Math">Math</SelectItem>
                          <SelectItem value="Behavioral">Behavioral</SelectItem>
                          <SelectItem value="Social">Social Emotional</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-24" />
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Toolbox</CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('multiple-choice')}>
                     <Layout className="mr-2 h-3 w-3" /> Multi Choice
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('true-false')}>
                     <Layout className="mr-2 h-3 w-3" /> True/False
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('short-answer')}>
                     <Layout className="mr-2 h-3 w-3" /> Text
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('scale')}>
                     <Layout className="mr-2 h-3 w-3" /> Scale
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('audio-response')}>
                     <Mic className="mr-2 h-3 w-3" /> Audio Rec
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => addQuestion('video-response')}>
                     <ImageIcon className="mr-2 h-3 w-3" /> Video Rec
                  </Button>
               </CardContent>
            </Card>
         </div>

         {/* Main Editor Area */}
         <div className="md:col-span-3">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="editor">Editor</TabsTrigger>
                   <TabsTrigger value="preview">Live Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4 mt-4">
                   {questions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg bg-muted/50">
                         <p className="text-muted-foreground mb-4">No questions added yet.</p>
                         <Button onClick={() => addQuestion()}>
                            <Plus className="mr-2 h-4 w-4" /> Add First Question
                         </Button>
                      </div>
                   ) : (
                      questions.map((q, index) => (
                         <QuestionBlock 
                            key={q.id} 
                            question={q} 
                            index={index} 
                            onUpdate={(updates) => updateQuestion(q.id, updates)}
                            onDelete={() => removeQuestion(q.id)}
                         />
                      ))
                   )}
                   
                   {questions.length > 0 && (
                      <Button variant="outline" className="w-full border-dashed" onClick={() => addQuestion()}>
                         <Plus className="mr-2 h-4 w-4" /> Add Question Block
                      </Button>
                   )}
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                   <AssessmentPreview template={{
                      id: "preview",
                      title,
                      description,
                      category,
                      questions,
                      createdBy: "",
                      createdAt: "",
                      updatedAt: "",
                      status: "draft",
                      settings: { allowBacktracking: true, shuffleQuestions: false }
                   }} />
                </TabsContent>
             </Tabs>
         </div>
      </div>

      <AIGeneratorDialog open={showAI} onOpenChange={setShowAI} onGenerate={handleAIResults} />
    </div>
  );
}
