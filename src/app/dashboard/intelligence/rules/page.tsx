"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { PersonalRule } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PersonalRulesPage() {
    const { data: rules, loading } = useFirestoreCollection<PersonalRule>("personalRules", "createdAt", "desc");
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState("general");
    const [severity, setSeverity] = useState<"info"|"warning"|"critical">("info");

    const handleCreate = async () => {
        if (!title || !desc) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, "personalRules"), {
                title,
                description: desc,
                category,
                severity,
                visibility: "private",
                ownerId: auth.currentUser?.uid || "system",
                createdAt: new Date().toISOString()
            });
            toast({ title: "Rule Created", description: "Saved to your personal logic." });
            setOpen(false);
            setTitle(""); setDesc(""); // Reset
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this rule?")) return;
        await deleteDoc(doc(db, "personalRules", id));
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Personal Rules</h1>
                    <p className="text-muted-foreground">Define your own logic and heuristics for the AI to follow.</p>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4"/> New Rule</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Personal Rule</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Rule Title</Label>
                                <Input placeholder="e.g. Always check for hearing loss" value={title} onChange={e => setTitle(e.target.value)}/>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea placeholder="Explain the logic..." value={desc} onChange={e => setDesc(e.target.value)}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="diagnosis">Diagnosis</SelectItem>
                                            <SelectItem value="report">Report Writing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Severity</Label>
                                    <Select value={severity} onValueChange={(v:any) => setSeverity(v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Rule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map(rule => (
                    <Card key={rule.id} className="relative group">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start pr-6">
                                <CardTitle className="text-lg font-semibold leading-tight">{rule.title}</CardTitle>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{rule.category}</Badge>
                                {rule.severity === 'critical' && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </CardContent>
                    </Card>
                ))}
                {!loading && rules.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No personal rules defined. Add one to guide the AI.
                    </div>
                )}
            </div>
        </div>
    );
}
