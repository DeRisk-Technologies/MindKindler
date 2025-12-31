"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { PolicyRuleDraft, PolicyRule } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, X, Save, Loader2, FileText, Quote } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateDoc, doc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function RuleDraftReviewPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const { data: draft, loading } = useFirestoreDocument<PolicyRuleDraft>("policyRuleDrafts", id);
    
    // Edit State
    const [form, setForm] = useState<Partial<PolicyRule>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (draft?.structuredDraft) {
            setForm(draft.structuredDraft);
        }
    }, [draft]);

    if (loading || !draft) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleUpdateField = (field: keyof PolicyRule, val: any) => {
        setForm(prev => ({ ...prev, [field]: val }));
    };

    const handleApprove = async () => {
        if (!form.title) return;
        setProcessing(true);
        try {
            // 1. Create Rule
            const ruleData = {
                ...form,
                tenantId: draft.tenantId,
                sourceDraftId: draft.id,
                sourceDocumentId: draft.sourceDocumentId,
                enabled: true,
                createdAt: new Date().toISOString(),
                version: 1
            };
            await addDoc(collection(db, "policyRules"), ruleData);

            // 2. Update Draft
            await updateDoc(doc(db, "policyRuleDrafts", id), {
                status: "approved",
                updatedAt: new Date().toISOString()
            });

            toast({ title: "Rule Published", description: "The policy is now active." });
            router.push('/dashboard/intelligence/policy-manager');
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await updateDoc(doc(db, "policyRuleDrafts", id), {
                status: "rejected",
                updatedAt: new Date().toISOString()
            });
            toast({ title: "Draft Rejected" });
            router.push('/dashboard/intelligence/rule-drafts');
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-2xl font-bold">Review Draft Rule</h1>
                    <div className="flex gap-2 mt-1 items-center text-sm text-muted-foreground">
                        <Badge variant="outline">{draft.status}</Badge>
                        <span>From Doc: {draft.sourceDocumentId}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Source Context */}
                <Card className="h-fit">
                    <CardHeader className="bg-slate-50 border-b pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Quote className="h-4 w-4 text-indigo-500"/> Extracted Text Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-muted-foreground">
                            "{draft.extractedText}"
                        </blockquote>
                        <div className="mt-4 flex gap-2">
                            {draft.citations?.map((c, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">Chunk {c}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Structured Form */}
                <Card>
                    <CardHeader><CardTitle>Structured Definition</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={form.title || ""} onChange={e => handleUpdateField("title", e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Trigger</Label>
                                <Select value={form.triggerEvent || ""} onValueChange={v => handleUpdateField("triggerEvent", v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="assessment.finalize">Assessment Finalize</SelectItem>
                                        <SelectItem value="document.upload">Document Upload</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Severity</Label>
                                <Select value={form.severity || ""} onValueChange={v => handleUpdateField("severity", v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Remediation</Label>
                            <Textarea value={form.remediation || ""} onChange={e => handleUpdateField("remediation", e.target.value)} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="grid gap-2">
                                <Label>Mode</Label>
                                <Select value={form.mode || "advisory"} onValueChange={v => handleUpdateField("mode", v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="advisory">Advisory</SelectItem>
                                        <SelectItem value="enforce">Enforce</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing || draft.status !== 'draft'}>
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                                Approve & Publish
                            </Button>
                            <Button variant="destructive" onClick={handleReject} disabled={processing || draft.status !== 'draft'}>
                                <X className="mr-2 h-4 w-4"/> Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
