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
import { Loader2, Save, Download, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, "reports", id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setReport({ id: docSnap.id, ...docSnap.data() } as Report);
                // Mock initial suggestions
                setAiSuggestions([
                    "Consider elaborating on the specific triggers for anxiety mentioned in the history.",
                    "The recommendation for 'extra time' could be more specific (e.g., 25% or 50%)."
                ]);
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
              status: 'final' 
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

  const handleAiRewrite = async (index: number) => {
      if (!report) return;
      toast({ description: "Refining section style..." });
      // Simulate AI Latency
      setTimeout(() => {
          const current = report.sections[index].content;
          handleSectionUpdate(index, current + " (Refined for clinical clarity).");
          toast({ title: "AI Rewrite Complete", description: "Content updated." });
      }, 1000);
  };

  const generateNewSuggestions = () => {
      setIsSuggesting(true);
      setTimeout(() => {
          setAiSuggestions([
              "Check consistency: 'ADHD' mentioned in summary but not in diagnosis section.",
              "Add a short-term goal for the reading intervention plan."
          ]);
          setIsSuggesting(false);
      }, 1500);
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
                            <div key={idx} className="space-y-2 group">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{section.title}</h3>
                                    <Button variant="ghost" size="sm" className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleAiRewrite(idx)}>
                                        <Sparkles className="mr-1 h-3 w-3" /> Improve
                                    </Button>
                                </div>
                                <Textarea 
                                    className="min-h-[150px] leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
                                    value={section.content}
                                    onChange={(e) => handleSectionUpdate(idx, e.target.value)}
                                />
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
                
                <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                         <CardTitle className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                             <Sparkles className="h-4 w-4" /> AI Suggestions
                         </CardTitle>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={generateNewSuggestions} disabled={isSuggesting}>
                             <Sparkles className={`h-3 w-3 ${isSuggesting ? 'animate-spin' : ''}`} />
                         </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {aiSuggestions.map((suggestion, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 p-2 rounded border text-xs text-muted-foreground shadow-sm flex gap-2">
                                <div className="mt-0.5"><Sparkles className="h-3 w-3 text-indigo-500" /></div>
                                {suggestion}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
