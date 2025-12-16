"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, "reports", id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setReport({ id: docSnap.id, ...docSnap.data() } as Report);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchReport();
  }, [id]);

  const handleSave = async () => {
      if (!report) return;
      setSaving(true);
      try {
          await updateDoc(doc(db, "reports", report.id), {
              ...report,
              status: 'final' // or keep as draft
          });
          toast({ title: "Saved", description: "Report updated successfully." });
      } catch (e) {
          toast({ title: "Error", description: "Failed to save report.", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  const handleSectionUpdate = (index: number, content: string) => {
      if (!report) return;
      const newSections = [...report.sections];
      newSections[index].content = content;
      setReport({ ...report, sections: newSections });
  };

  if (loading || !report) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Report Editor</h1>
                <p className="text-muted-foreground">Review and finalize the clinical documentation.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Final
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <Input 
                            className="text-xl font-bold border-none px-0 shadow-none focus-visible:ring-0" 
                            value={report.title} 
                            onChange={(e) => setReport({...report, title: e.target.value})}
                        />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {report.sections?.map((section, idx) => (
                            <div key={idx} className="space-y-2">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{section.title}</h3>
                                <Textarea 
                                    className="min-h-[150px] leading-relaxed resize-none" 
                                    value={section.content}
                                    onChange={(e) => handleSectionUpdate(idx, e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" className="text-xs text-indigo-500">
                                        <Sparkles className="mr-1 h-3 w-3" /> Rewrite with AI
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Date:</span>
                             <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Author:</span>
                             <span>Dr. EPP</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Language:</span>
                             <span className="uppercase">{report.language}</span>
                         </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader>
                         <CardTitle className="text-sm text-blue-700">AI Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-muted-foreground">
                        <p>Consider adding more detail to the "Social History" section regarding peer interactions.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
