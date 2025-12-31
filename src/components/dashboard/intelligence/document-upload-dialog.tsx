"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ingestDocument } from "@/ai/knowledge/ingest";
import { KnowledgeDocument } from "@/types/schema";
import { evaluateEvent } from "@/ai/guardian/engine";
import { Switch } from "@/components/ui/switch";

interface Props {
    type: 'rulebook' | 'report' | 'evidence';
    onUploadComplete?: () => void;
}

export function DocumentUploadDialog({ type, onUploadComplete }: Props) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    
    // Form States
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [visibility, setVisibility] = useState<"private"|"team"|"public">("team");
    const [authority, setAuthority] = useState(""); 
    
    // Evidence Specific
    const [evidenceType, setEvidenceType] = useState("guideline");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [trustScore, setTrustScore] = useState(80);
    const [verified, setVerified] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!title) setTitle(e.target.files[0].name.split('.')[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !title) return;
        setUploading(true);

        try {
            const mockStoragePath = `gs://mock-bucket/knowledge/${file.name}`;

            const docData: Omit<KnowledgeDocument, 'id'> = {
                type,
                title,
                ownerId: auth.currentUser?.uid || 'system',
                visibility,
                storagePath: mockStoragePath,
                status: 'uploaded',
                metadata: {
                    originalFileName: file.name,
                    authority: type === 'rulebook' ? authority : undefined,
                    // Evidence Fields
                    evidenceType: type === 'evidence' ? evidenceType : undefined,
                    publicationYear: type === 'evidence' ? year : undefined,
                    trustScore: type === 'evidence' ? trustScore : undefined,
                    verified: type === 'evidence' ? verified : undefined,
                    caseTags: [] 
                },
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "knowledgeDocuments"), docData);
            
            toast({ title: "Upload Complete", description: "Starting indexing pipeline..." });
            
            await ingestDocument({ id: docRef.id, ...docData } as KnowledgeDocument);
            
            // Guardian Check
            const findings = await evaluateEvent({
                eventType: 'document.upload',
                tenantId: 'default',
                actorUserId: auth.currentUser?.uid || 'unknown',
                subjectType: 'document',
                subjectId: docRef.id,
                context: {
                    visibility,
                    containsPII: false, 
                    requiredMetadata: type === 'rulebook' ? ['authority'] : []
                }
            });

            if (findings.length > 0) {
                toast({ 
                    title: "Guardian Warning", 
                    description: findings[0].message, 
                    variant: "destructive",
                    duration: 6000
                });
            } else {
                toast({ title: "Indexing Complete", description: "Document is now searchable." });
            }

            setOpen(false);
            if (onUploadComplete) onUploadComplete();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload {type === 'rulebook' ? "Rulebook" : type === 'evidence' ? "Evidence" : "Report"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload {type === 'evidence' ? "Verified Evidence" : type === 'rulebook' ? "Compliance Rulebook" : "Past Report"}</DialogTitle>
                    <DialogDescription>Supported: PDF, DOCX, TXT. Max 10MB.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Document Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Early Literacy Research" />
                    </div>
                    
                    {type === 'rulebook' && (
                        <div className="grid gap-2">
                            <Label>Issuing Authority</Label>
                            <Input value={authority} onChange={e => setAuthority(e.target.value)} placeholder="e.g. Ministry of Education" />
                        </div>
                    )}

                    {type === 'evidence' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select value={evidenceType} onValueChange={setEvidenceType}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="guideline">Guideline</SelectItem>
                                            <SelectItem value="peerReviewed">Peer Reviewed</SelectItem>
                                            <SelectItem value="thesis">Thesis</SelectItem>
                                            <SelectItem value="textbook">Textbook</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Year</Label>
                                    <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded border">
                                <div className="grid gap-2">
                                    <Label>Trust Score (0-100)</Label>
                                    <Input type="number" value={trustScore} onChange={e => setTrustScore(Number(e.target.value))} />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <Switch checked={verified} onCheckedChange={setVerified} id="verified" />
                                    <Label htmlFor="verified" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Verified</Label>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label>Visibility</Label>
                        <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private (Only Me)</SelectItem>
                                <SelectItem value="team">Team (My Organization)</SelectItem>
                                <SelectItem value="public">Tenant Wide (All Users)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                        <FileText className="h-8 w-8 mb-2" />
                        {file ? <span className="text-sm font-semibold text-primary">{file.name}</span> : <span>Click to select file</span>}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleUpload} disabled={uploading || !file}>
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {uploading ? "Uploading & Indexing..." : "Upload Document"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
