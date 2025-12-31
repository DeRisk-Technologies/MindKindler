"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { processDocument } from "@/integrations/documentAI/pipeline";
import { DOCUMENT_CATEGORIES } from "@/integrations/documentAI/categories";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NewExtractionPage() {
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("results");
    const [processing, setProcessing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const runId = await processDocument(file, category);
            toast({ title: "Extraction Complete", description: "Review the results." });
            router.push(`/dashboard/integrations/document-ai/${runId}`);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">New Extraction</h1>

            <Card>
                <CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center relative hover:bg-slate-50">
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                        <UploadCloud className="h-12 w-12 mb-4 text-slate-400" />
                        <p className="text-sm text-muted-foreground">{file ? file.name : "Select PDF, Image, or Excel"}</p>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Document Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Select the correct type to apply validation rules.</p>
                    </div>

                    <Button className="w-full" onClick={handleUpload} disabled={!file || processing}>
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4"/>}
                        Extract Data
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
