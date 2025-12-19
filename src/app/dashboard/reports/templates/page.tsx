"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, GripVertical, Save, ArrowLeft, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Basic Drag-and-Drop feel (simplified for speed without dnd-kit yet)
// Users can add sections to a report template

interface TemplateSection {
    id: string;
    title: string;
    prompt: string; // Instructions for AI
    type: 'text' | 'list' | 'table';
    required: boolean;
}

export default function TemplateDesignerPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [sections, setSections] = useState<TemplateSection[]>([
      { id: '1', title: 'Introduction', prompt: 'Summarize the reason for referral and background.', type: 'text', required: true }
  ]);

  const addSection = () => {
      setSections([...sections, {
          id: Date.now().toString(),
          title: "New Section",
          prompt: "",
          type: "text",
          required: true
      }]);
  };

  const updateSection = (id: string, field: keyof TemplateSection, value: any) => {
      setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
      setSections(sections.filter(s => s.id !== id));
  };

  const handleSave = async () => {
      if (!title) {
          toast({ title: "Error", description: "Template title is required.", variant: "destructive" });
          return;
      }

      try {
          await addDoc(collection(db, "report_templates"), {
              title,
              description,
              category,
              sections,
              createdBy: "user", // In real app, auth.currentUser.uid
              createdAt: serverTimestamp(),
              status: 'active'
          });
          
          toast({ title: "Template Saved", description: "Your custom report template is ready." });
          router.push('/dashboard/reports');
      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
      }
  };

  return (
    <div className="space-y-6 p-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Template Designer</h1>
                <p className="text-muted-foreground">Create custom structures for AI-generated reports.</p>
            </div>
            <Button onClick={handleSave} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save Template
            </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            {/* Metadata Sidebar */}
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input placeholder="e.g. Monthly Behavioral Report" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="clinical">Clinical</SelectItem>
                                <SelectItem value="educational">Educational</SelectItem>
                                <SelectItem value="administrative">Administrative</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="What is this report for?" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            {/* Editor Area */}
            <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Sections Structure</CardTitle>
                    <Button variant="outline" size="sm" onClick={addSection}>
                        <Plus className="mr-2 h-4 w-4" /> Add Section
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sections.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            No sections yet. Add one to start.
                        </div>
                    )}
                    
                    {sections.map((section, index) => (
                        <div key={section.id} className="border rounded-lg p-4 bg-muted/20 relative group transition-all hover:bg-muted/40">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground opacity-50 hover:opacity-100">
                                <GripVertical className="h-5 w-5" />
                            </div>
                            
                            <div className="pl-8 space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Section Title</Label>
                                        <Input 
                                            value={section.title} 
                                            onChange={(e) => updateSection(section.id, 'title', e.target.value)} 
                                            className="font-semibold"
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Format</Label>
                                        <Select 
                                            value={section.type} 
                                            onValueChange={(val) => updateSection(section.id, 'type', val)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Paragraph</SelectItem>
                                                <SelectItem value="list">Bullet List</SelectItem>
                                                <SelectItem value="table">Table</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-3 w-3 text-primary" />
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">AI Instructions</Label>
                                    </div>
                                    <Textarea 
                                        value={section.prompt} 
                                        onChange={(e) => updateSection(section.id, 'prompt', e.target.value)}
                                        placeholder="Tell the AI what to include in this section..."
                                        className="h-20 text-sm"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={section.required} 
                                            onCheckedChange={(checked) => updateSection(section.id, 'required', checked)} 
                                        />
                                        <Label className="text-sm text-muted-foreground">Required Section</Label>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeSection(section.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
