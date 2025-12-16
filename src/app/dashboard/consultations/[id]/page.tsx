"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ConsultationSession, Student } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Save, FileText, BrainCircuit, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateConsultationReport } from "@/ai/flows/generate-consultation-report";
import { generateConsultationInsights } from "@/ai/flows/generate-consultation-insights";

export default function LiveConsultationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]); // Diagnosis/Intervention
  const [aiLoading, setAiLoading] = useState(false);
  
  // Simulated Transcription Buffer
  const [transcript, setTranscript] = useState<string>("");
  const transcriptRef = useRef(""); // Ref to keep track of latest transcript for interval

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            const sessionSnap = await getDoc(doc(db, "consultation_sessions", id as string));
            if (sessionSnap.exists()) {
                const sData = { id: sessionSnap.id, ...sessionSnap.data() } as ConsultationSession;
                setSession(sData);
                setNotes(sData.notes || "");
                
                const studentSnap = await getDoc(doc(db, "students", sData.studentId));
                if (studentSnap.exists()) {
                    setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  // Simulated Real-time Transcription
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRecording) {
          interval = setInterval(() => {
              // Mock appending text to transcript
              // In a real app, this would come from a WebSpeech API or websocket
              const newSegment = " The student seems distracted... ";
              setTranscript(prev => prev + newSegment);
              
              // Trigger AI analysis occasionally
              if (Math.random() > 0.7) {
                 triggerAiAnalysis(newSegment);
              }
          }, 4000);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
      setIsRecording(!isRecording);
      toast({ 
          title: isRecording ? "Recording Paused" : "Listening...", 
          description: isRecording ? "Transcript saved." : "Co-Pilot is active.",
          variant: isRecording ? "default" : "default" 
      });
  };

  const triggerAiAnalysis = async (chunk: string) => {
      if(!student) return;
      setAiLoading(true);
      try {
          const result = await generateConsultationInsights({
              transcriptChunk: chunk,
              currentNotes: notes,
              studentAge: new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear()
          });
          
          if(result && result.insights) {
              setAiSuggestions(prev => [...result.insights, ...prev]);
          }
      } catch (e) {
          console.error("AI Insight Error", e);
      } finally {
          setAiLoading(false);
      }
  };

  const handleSaveNotes = async () => {
      if (!session) return;
      await updateDoc(doc(db, "consultation_sessions", session.id), {
          notes,
          transcript
      });
      toast({ title: "Saved", description: "Session notes updated." });
  };

  const handleGenerateReport = async () => {
      if (!session || !student) return;
      toast({ title: "Generating Report", description: "AI is drafting the consultation summary..." });
      
      try {
          const reportData = await generateConsultationReport({ 
              studentName: `${student.firstName} ${student.lastName}`,
              age: new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear(),
              transcript: transcript,
              notes: notes,
              historySummary: "See student history.", // This would ideally be passed from the summary card
              templateType: 'SOAP'
          });

          // Save to Firestore
          const reportDoc = await addDoc(collection(db, "reports"), {
              caseId: session.caseId,
              sessionId: session.id,
              studentId: student.id,
              title: reportData.title,
              sections: reportData.sections,
              generatedContent: reportData.summary, // Fallback
              language: 'en',
              createdAt: new Date().toISOString(),
              status: 'draft',
              version: 1
          });
          
          await updateDoc(doc(db, "consultation_sessions", session.id), {
              reportId: reportDoc.id,
              status: 'completed'
          });

          toast({ title: "Report Ready", description: "Draft created successfully." });
          router.push(`/dashboard/reports/editor/${reportDoc.id}`);
          
      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
      }
  };

  if (loading || !session || !student) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Calculate age safely
  const age = student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : "N/A";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-background">
       {/* LEFT: Main Consultation Area */}
       <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
           {/* Header */}
           <div className="flex justify-between items-start">
               <div>
                   <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
                   <p className="text-muted-foreground text-sm">Age: {age} • Diagnosis: {student.diagnosisCategory?.join(", ") || "None"}</p>
               </div>
               <div className="flex gap-2">
                   <Button variant={isRecording ? "destructive" : "default"} onClick={toggleRecording} className="w-32">
                       {isRecording ? <><MicOff className="mr-2 h-4 w-4" /> Pause</> : <><Mic className="mr-2 h-4 w-4" /> Listen</>}
                   </Button>
                   <Button variant="outline" onClick={handleSaveNotes}>
                       <Save className="mr-2 h-4 w-4" /> Save
                   </Button>
                   <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0" onClick={handleGenerateReport}>
                       <FileText className="mr-2 h-4 w-4" /> End & Report
                   </Button>
               </div>
           </div>
           
           {/* History Summary (AI Generated Pre-Chart) */}
           <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
               <CardHeader className="py-3">
                   <CardTitle className="text-sm font-medium flex items-center text-blue-700 dark:text-blue-300">
                       <Sparkles className="mr-2 h-3 w-3" /> History Summary
                   </CardTitle>
               </CardHeader>
               <CardContent className="pb-3 text-sm text-muted-foreground">
                   {/* In a real implementation, this would be generated via RAG from the 'knowledge_base' or 'cases' collection */}
                   Student has a history of {student.diagnosisCategory?.join(", ") || "reported concerns"}. 
                   Previous interventions: {student.history ? "Documented in file." : "None recorded."}
                   {/* Placeholder for RAG summary */}
               </CardContent>
           </Card>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
               {/* Notes Editor */}
               <Card className="flex flex-col h-full">
                   <CardHeader className="py-3 bg-muted/30">
                       <CardTitle className="text-sm">Clinical Notes</CardTitle>
                   </CardHeader>
                   <CardContent className="p-0 flex-1">
                       <Textarea 
                           className="h-full border-0 resize-none focus-visible:ring-0 p-4 leading-relaxed" 
                           placeholder="Type observations here..." 
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                       />
                   </CardContent>
               </Card>
               
               {/* Live Transcript View */}
               <Card className="flex flex-col h-full">
                   <CardHeader className="py-3 bg-muted/30">
                       <CardTitle className="text-sm">Live Transcript</CardTitle>
                   </CardHeader>
                   <ScrollArea className="flex-1 p-4">
                       <p className="text-sm text-muted-foreground leading-loose whitespace-pre-wrap">
                           {transcript || "Transcription will appear here..."}
                       </p>
                   </ScrollArea>
               </Card>
           </div>
       </div>

       {/* RIGHT: AI Co-Pilot Sidebar */}
       <div className="w-full md:w-[350px] border-l bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-col gap-4">
           <div className="flex items-center gap-2 pb-2 border-b">
               <BrainCircuit className="h-5 w-5 text-indigo-600" />
               <h2 className="font-semibold text-sm">Co-Pilot Insights</h2>
               {aiLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
           </div>

           <ScrollArea className="flex-1 pr-2">
               <div className="space-y-4">
                   {/* Suggestion Cards */}
                   {aiSuggestions.length === 0 && (
                       <p className="text-xs text-muted-foreground text-center py-8">
                           Listening for clinical cues...
                       </p>
                   )}
                   
                   {aiSuggestions.map((insight, i) => (
                       <Card key={i} className={`border-l-4 shadow-sm animate-in fade-in slide-in-from-right-4 ${
                           insight.type === 'risk' ? 'border-l-red-500' :
                           insight.type === 'treatment' ? 'border-l-green-500' :
                           'border-l-orange-400'
                       }`}>
                           <CardContent className="p-3 space-y-2">
                               <div className="flex justify-between items-start">
                                   <Badge variant="outline" className="text-[10px] uppercase">{insight.type}</Badge>
                                   <span className="text-[10px] text-muted-foreground">{insight.confidence} conf.</span>
                               </div>
                               <p className="text-sm font-medium leading-tight">
                                   {insight.text}
                               </p>
                               {insight.rationale && <p className="text-xs text-muted-foreground italic">{insight.rationale}</p>}
                               
                               <div className="flex gap-2 pt-1">
                                   <Button size="sm" variant="outline" className="h-6 text-xs w-full border-green-200 hover:bg-green-50 text-green-700" onClick={() => {
                                       setNotes(prev => prev + "\n" + insight.text);
                                       toast({description: "Added to notes"});
                                   }}>
                                       <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                                   </Button>
                                   <Button size="sm" variant="ghost" className="h-6 text-xs w-full text-muted-foreground">
                                       <XCircle className="mr-1 h-3 w-3" /> Dismiss
                                   </Button>
                               </div>
                           </CardContent>
                       </Card>
                   ))}
               </div>
           </ScrollArea>

           {/* Quick Actions */}
           <div className="grid grid-cols-2 gap-2 pt-4 border-t">
               <Button variant="outline" size="sm">DSM-5 Ref</Button>
               <Button variant="outline" size="sm">Past Cases</Button>
           </div>
       </div>
    </div>
  );
}
