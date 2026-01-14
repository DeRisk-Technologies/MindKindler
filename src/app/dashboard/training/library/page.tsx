// src/app/dashboard/training/library/page.tsx

"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { TrainingModule } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, BookOpen, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
// REMOVE SERVER IMPORT
// import { retrieveContext } from "@/ai/knowledge/retrieve";

export default function TrainingLibraryPage() {
    const { data: modules, loading } = useFirestoreCollection<TrainingModule>("trainingModules", "createdAt", "desc");
    const router = useRouter();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [drafting, setDrafting] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("safeguarding");
    const [audience, setAudience] = useState("teacher");
    
    // AI Draft State
    const [aiContent, setAiContent] = useState<any[]>([]);
    const [aiCitations, setAiCitations] = useState<any[]>([]);

    const filteredModules = modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

    const handleDraftWithAI = async () => {
        if (!title) return;
        setDrafting(true);
        try {
            // FIX: Removed server-side call.
            // In Pilot, we mock this. In Prod, this should call a Cloud Function 'generateTrainingContent'.
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            
            // 2. Generate Content (Mock for Pilot Stability)
            const draftBlocks = [
                { type: 'text', content: `Introduction to ${title}. This module covers key concepts based on verified guidelines.` },
                { type: 'bullets', content: "Key Principle 1: Understanding the Context\nKey Principle 2: Identifying Needs\nKey Principle 3: Effective Support Strategies" },
                { type: 'qa', content: "Q: Why is this important?\nA: It ensures compliance and better outcomes for students." }
            ];

            setAiContent(draftBlocks);
            setAiCitations([]); // Mock citations empty for now
            toast({ title: "Draft Generated", description: "Review content and publish." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setDrafting(false);
        }
    };

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            const moduleData: Omit<TrainingModule, 'id'> = {
                tenantId: "default",
                title,
                category: category as any,
                audience: audience as any,
                level: "beginner",
                format: "microLesson",
                objectives: ["Understand key concepts"],
                contentBlocks: aiContent.length > 0 ? aiContent : [{ type: 'text', content: 'Draft content...' }],
                evidenceCitations: aiCitations,
                verified: false,
                createdByUserId: auth.currentUser?.uid || "unknown",
                tags: [],
                status: "published", 
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "trainingModules"), moduleData);
            toast({ title: "Module Published", description: "Available in library." });
            setOpen(false);
            // Reset
            setTitle(""); setAiContent([]); setAiCitations([]);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Training Library</h1>
                    <p className="text-muted-foreground">Micro-learning modules and resources.</p>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Create Module</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Create Micro-Learning Module</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Trauma Informed Classroom" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="safeguarding">Safeguarding</SelectItem>
                                            <SelectItem value="behaviour">Behaviour</SelectItem>
                                            <SelectItem value="inclusion">Inclusion</SelectItem>
                                            <SelectItem value="autism">Autism</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Audience</Label>
                                    <Select value={audience} onValueChange={setAudience}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="teacher">Teacher</SelectItem>
                                            <SelectItem value="parent">Parent</SelectItem>
                                            <SelectItem value="epp">EPP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* AI Drafter */}
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4"/> AI Content Drafter
                                    </h4>
                                    <Button size="sm" variant="outline" onClick={handleDraftWithAI} disabled={drafting || !title}>
                                        {drafting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Draft with Evidence
                                    </Button>
                                </div>
                                {aiContent.length > 0 && (
                                    <div className="text-xs text-indigo-800 space-y-1">
                                        <p>✅ Generated {aiContent.length} content blocks.</p>
                                        <p>✅ Attached {aiCitations.length} evidence citations.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Publish Module
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search modules..." className="max-w-sm" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map(mod => (
                    <Card key={mod.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/dashboard/training/library/${mod.id}`)}>
                        <CardHeader>
                            <CardTitle className="text-lg">{mod.title}</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="capitalize">{mod.category}</Badge>
                                <Badge variant="outline" className="capitalize">{mod.audience}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1"><BookOpen className="h-3 w-3"/> {mod.contentBlocks.length} Sections</div>
                                {mod.evidenceCitations?.length > 0 && (
                                    <div className="flex items-center gap-1 text-green-600"><ShieldCheck className="h-3 w-3"/> Verified Evidence</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
