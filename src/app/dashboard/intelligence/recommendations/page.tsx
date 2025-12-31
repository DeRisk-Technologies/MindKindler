"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { RecommendationTemplate } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function RecommendationLibraryPage() {
    const { data: recommendations, loading } = useFirestoreCollection<RecommendationTemplate>("recommendationTemplates", "createdAt", "desc");
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("learning");
    const [target, setTarget] = useState("student");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState(""); // Simplified

    const handleCreate = async () => {
        if (!title || !description) return;
        setIsSaving(true);
        try {
            const data: Omit<RecommendationTemplate, 'id'> = {
                tenantId: "default",
                title,
                category: category as any,
                target: target as any,
                description,
                steps: steps.split('\n').filter(s => s.trim()),
                expectedOutcomes: [],
                monitoringIndicators: [],
                evidenceCitations: [], // Mocked for v1
                jurisdictionTags: [],
                createdByUserId: auth.currentUser?.uid || "unknown",
                verified: false,
                tags: []
            };
            await addDoc(collection(db, "recommendationTemplates"), data);
            toast({ title: "Template Created", description: "Added to library." });
            setOpen(false);
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
                    <h1 className="text-3xl font-bold">Recommendation Library</h1>
                    <p className="text-muted-foreground">Evidence-based strategies and intervention templates.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Template</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Recommendation Template</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Phonics Remediation" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="learning">Learning</SelectItem>
                                            <SelectItem value="behavioural">Behavioural</SelectItem>
                                            <SelectItem value="emotional">Emotional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Target</Label>
                                    <Select value={target} onValueChange={setTarget}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="parent">Parent</SelectItem>
                                            <SelectItem value="teacher">Teacher</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Steps (One per line)</Label>
                                <Textarea value={steps} onChange={e => setSteps(e.target.value)} className="h-32" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Template
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map(rec => (
                    <Card key={rec.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="capitalize">{rec.category}</Badge>
                                <Badge variant="outline" className="capitalize">{rec.target}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-3">{rec.description}</p>
                            {rec.evidenceCitations && rec.evidenceCitations.length > 0 && (
                                <div className="text-xs flex items-center text-green-700 bg-green-50 p-2 rounded">
                                    <BookOpen className="h-3 w-3 mr-1"/> {rec.evidenceCitations.length} Evidence Links
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
