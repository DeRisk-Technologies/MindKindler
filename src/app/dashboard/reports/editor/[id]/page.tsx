"use client";

import { useEffect, useState, use } from "react"; 
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, getRegionalDb, db as globalDb } from "@/lib/firebase"; 
import { Report } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Download, Sparkles, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge"; // Fixed: Added Import

export default function ReportEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [report, setReport] = useState<any | null>(null); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDb, setActiveDb] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
        if (!id || !user) return;

        try {
            let region = user.region;
            if (!region || region === 'default') {
                const routingRef = doc(globalDb, 'user_routing', user.uid);
                const routingSnap = await getDoc(routingRef);
                region = routingSnap.exists() ? routingSnap.data().region : 'uk';
            }
            
            const targetDb = getRegionalDb(region);
            setActiveDb(targetDb);
            
            const docRef = doc(targetDb, "reports", id as string);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setReport({ id: docSnap.id, ...docSnap.data() });
                setAiSuggestions([
                    "Consider elaborating on the specific triggers for anxiety mentioned in the history.",
                    "The recommendation for 'extra time' could be more specific."
                ]);
            } else {
                toast({ variant: "destructive", title: "Report Not Found" });
            }
        } catch (e) {
            console.error("Fetch error", e);
        } finally {
            setLoading(false);
        }
    };
    fetchReport();
  }, [id, user, toast]);

  const handleSave = async () => {
      if (!report || !activeDb) return;
      setSaving(true);
      try {
          const docRef = doc(activeDb, "reports", report.id);
          await updateDoc(docRef, {
              ...report,
              updatedAt: new Date().toISOString(),
              status: 'final' 
          });
          toast({ title: "Saved", description: "Report finalized." });
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  const handleSectionUpdate = (index: number, content: string) => {
      if (!report) return;
      const newContent = Array.isArray(report.content) ? [...report.content] : [];
      if (newContent[index]) {
          newContent[index].content = content;
          setReport({ ...report, content: newContent });
      }
  };

  if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
          <p className="text-slate-500 font-medium">Opening Report...</p>
      </div>
  );

  if (!report) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold">Report not found</h2>
        <Button onClick={() => router.push('/dashboard/reports')}>Back to Directory</Button>
    </div>
  );

  return (
    <div className="space-y-6 p-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4"/></Button>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Clinical Report Editor</h1>
                    <p className="text-muted-foreground text-sm">Reviewing: {report.studentName}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Finalize Document
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
                <Card className="border-none shadow-lg">
                    <CardHeader className="border-b bg-slate-50/50">
                        <Input 
                            className="text-xl font-bold border-none bg-transparent px-0 shadow-none focus-visible:ring-0" 
                            value={report.title} 
                            onChange={(e) => setReport({...report, title: e.target.value})}
                        />
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        {Array.isArray(report.content) ? report.content.map((section, idx) => (
                            <div key={idx} className="space-y-3 group">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-indigo-600">{section.title}</h3>
                                    <Button variant="ghost" size="sm" className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Sparkles className="mr-1 h-3 w-3" /> AI Refine
                                    </Button>
                                </div>
                                <Textarea 
                                    className="min-h-[200px] leading-relaxed text-base p-4 border-slate-100 focus-visible:ring-indigo-500" 
                                    value={section.content}
                                    onChange={(e) => handleSectionUpdate(idx, e.target.value)}
                                />
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 italic">No sections found.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="col-span-1 space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-3">
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Draft Created:</span>
                             <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Status:</span>
                             <Badge variant="secondary" className="capitalize">{report.status}</Badge>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">Shard ID:</span>
                             <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{report.id.substring(0,8)}</span>
                         </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-indigo-700 flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Co-Pilot Advice</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {aiSuggestions.map((suggestion, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-600 shadow-sm flex gap-2">
                                <div className="mt-0.5"><Sparkles className="h-3 w-3 text-indigo-400" /></div>
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
