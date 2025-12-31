"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { ProcurementPack } from "@/govintel/procurement/generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Download, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Citations } from "@/components/ui/citations";
import { Textarea } from "@/components/ui/textarea";

export default function ProcurementEditorPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: pack, loading } = useFirestoreDocument<ProcurementPack>("procurementPacks", id);
    const { toast } = useToast();
    
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [editedContent, setEditedContent] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (pack && pack.documents.length > 0) {
            setEditedContent(pack.documents[selectedDocIndex].contentHtml);
        }
    }, [pack, selectedDocIndex]);

    if (loading || !pack) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const currentDoc = pack.documents[selectedDocIndex];

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedDocs = [...pack.documents];
            updatedDocs[selectedDocIndex].contentHtml = editedContent;
            
            await updateDoc(doc(db, "procurementPacks", id), {
                documents: updatedDocs
            });
            toast({ title: "Saved", description: "Document updated." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        // Mock Export
        toast({ title: "Export Started", description: "Generating PDF bundle..." });
    };

    return (
        <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                    <div>
                        <h1 className="text-2xl font-bold">Procurement Pack Editor</h1>
                        <p className="text-muted-foreground">{pack.jurisdiction} • {new Date(pack.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4"/> Export Bundle
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Sidebar */}
                <Card className="w-64 flex flex-col overflow-hidden">
                    <div className="p-4 border-b font-medium bg-slate-50">Documents</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {pack.documents.map((d, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDocIndex(i)}
                                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedDocIndex === i ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100'}`}
                            >
                                <FileText className="h-4 w-4 opacity-70"/> {d.title}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b font-medium bg-slate-50">Content Editor</div>
                        <div className="flex-1 p-4 overflow-hidden flex flex-col">
                            {/* In a real app, use Tiptap/Quill. For now, textarea + HTML render preview */}
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <Textarea 
                                    className="h-full font-mono text-sm resize-none" 
                                    value={editedContent}
                                    onChange={e => setEditedContent(e.target.value)}
                                />
                                <div 
                                    className="h-full border rounded p-4 overflow-y-auto prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: editedContent }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Citations Panel */}
                    <div className="h-64 overflow-y-auto">
                        <Citations citations={currentDoc.citations.map(c => ({ chunk: c, score: 1 }))} />
                    </div>
                </div>
            </div>
        </div>
    );
}
