"use client";

import { useEffect, useState, use } from "react"; 
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase";
import { ConsultationSession, Student } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Save, FileText, BrainCircuit, Sparkles, FolderPlus, ClipboardList, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { generateConsultationReport } from "@/ai/flows/generate-consultation-report";
import { generateConsultationInsights } from "@/ai/flows/generate-consultation-insights";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/use-permissions";

export default function LiveConsultationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const id = params.id;
  
  const router = useRouter();
  const { toast } = useToast();
  const { shardId, loading: permissionsLoading } = usePermissions(); 
  
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [observationNotes, setObservationNotes] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]); 
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (!id || permissionsLoading) return;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`[LiveConsultation] Fetching session ${id} from shard: ${shardId}`);
            
            const targetDb = (shardId && shardId !== 'default') 
                ? getRegionalDb(shardId.replace('mindkindler-', '')) 
                : db;
            
            const sessionRef = doc(targetDb, "consultation_sessions", id);
            const sessionSnap = await getDoc(sessionRef);
            
            if (sessionSnap.exists()) {
                const sData = { id: sessionSnap.id, ...sessionSnap.data() } as ConsultationSession;
                
                // REDIRECT LOGIC: If session is already completed/synthesized, go to Synthesis View
                if (sData.status === 'completed' || sData.status === 'synthesized') {
                    console.log("Session completed, redirecting to synthesis...");
                    router.replace(`/dashboard/consultations/synthesis/${id}`);
                    return;
                }

                setSession(sData);
                setObservationNotes(sData.notes || "");
                
                if (sData.studentId) {
                    const studentSnap = await getDoc(doc(targetDb, "students", sData.studentId));
                    if (studentSnap.exists()) {
                        setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
                    } else {
                        setError("Student record linked to this session was not found.");
                    }
                } else {
                    setError("This consultation session is not linked to a student record.");
                }
            } else {
                setError("Consultation session not found.");
            }
        } catch (e: any) {
            console.error("Error fetching consultation data:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id, shardId, permissionsLoading, router]);

  // Real-time AI Analysis
  useEffect(() => {
      if (listening && transcript.length - lastAnalyzedLength > 300) {
          triggerAiAnalysis();
          setLastAnalyzedLength(transcript.length);
      }
  }, [transcript, listening, lastAnalyzedLength]);

  const toggleRecording = () => {
      if (listening) {
          SpeechRecognition.stopListening();
          toast({ title: "Paused", description: "Recording stopped." });
          if (transcript.length > lastAnalyzedLength) {
              triggerAiAnalysis();
              setLastAnalyzedLength(transcript.length);
          }
      } else {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
          toast({ title: "Listening...", description: "Speak clearly." });
      }
  };

  const triggerAiAnalysis = async () => {
      if(!student) return;
      setAiLoading(true);
      try {
          const result = await generateConsultationInsights({
              fullTranscript: transcript,
              currentNotes: observationNotes + "\n" + diagnosisNotes,
              studentAge: student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : 10,
              locale: "en-GB",
              languageLabel: "English (UK)"
          });
          
          if(result && result.insights) {
              setAiSuggestions(result.insights);
          }
      } catch (e) {
          console.error("AI Insight Error", e);
      } finally {
          setAiLoading(false);
      }
  };

  const handleSaveNotes = async () => {
      if (!session || !shardId) return;
      const targetDb = getRegionalDb(shardId.replace('mindkindler-', ''));
      const fullNotes = `OBSERVATIONS:\n${observationNotes}\n\nDIAGNOSIS:\n${diagnosisNotes}`;
      
      try {
          await updateDoc(doc(targetDb, "consultation_sessions", session.id), {
              notes: fullNotes,
              transcript: transcript,
              updatedAt: serverTimestamp()
          });
          toast({ title: "Saved", description: "Session notes updated." });
      } catch (err) {
          toast({ title: "Save Failed", variant: "destructive" });
      }
  };

  const handleGenerateReport = async () => {
      // Legacy Handler - Redirect to Synthesis
      router.push(`/dashboard/consultations/synthesis/${id}`);
  };

  const acceptInsight = (text: string, type: string) => {
      if (type === 'risk' || type === 'diagnosis') {
          setDiagnosisNotes(prev => prev + "\n- " + text);
      } else {
          setObservationNotes(prev => prev + "\n- " + text);
      }
      toast({description: "Added to notes"});
  };

  if (!browserSupportsSpeechRecognition) {
      return <div className="p-8 text-center">Browser does not support speech recognition. Please use Chrome.</div>;
  }

  if (error) {
      return (
          <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Consultation Unavailable</h2>
                  <p className="text-slate-600 max-w-md">{error}</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard/consultations')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
              </Button>
          </div>
      );
  }

  if (loading) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="text-muted-foreground animate-pulse font-medium">Loading Session...</p>
        </div>
      );
  }

  if (!session || !student) {
      return <div className="h-screen flex items-center justify-center">Missing session context.</div>;
  }

  const ageLabel = student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : "N/A";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-background">
       {/* Main Consultation Area - LEGACY VIEW (Only seen if status is scheduled/in_progress) */}
       <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
           {/* Header */}
           <div className="flex justify-between items-start">
               <div>
                   <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
                   <p className="text-muted-foreground text-sm">Age: {ageLabel} • Diagnosis: {student.needs?.join(", ") || "None"}</p>
               </div>
               <div className="flex gap-2">
                   <Button variant={listening ? "destructive" : "default"} onClick={toggleRecording} className="w-32 transition-all">
                       {listening ? <><MicOff className="mr-2 h-4 w-4 animate-pulse" /> Pause</> : <><Mic className="mr-2 h-4 w-4" /> Listen</>}
                   </Button>
                   <Button variant="outline" onClick={handleSaveNotes}>
                       <Save className="mr-2 h-4 w-4" /> Save
                   </Button>
                   <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0" onClick={handleGenerateReport}>
                       <FileText className="mr-2 h-4 w-4" /> End & Report
                   </Button>
               </div>
           </div>
           
           <Card className="bg-blue-50/50 border-blue-100">
               <CardHeader className="py-3">
                   <CardTitle className="text-sm font-medium flex items-center text-blue-700">
                       <Sparkles className="mr-2 h-3 w-3" /> Session Context
                   </CardTitle>
               </CardHeader>
               <CardContent className="pb-3 text-sm text-muted-foreground">
                   Consultation type: <Badge variant="outline" className="capitalize">{session.type}</Badge> 
                   {student.needs && student.needs.length > 0 && ` • Primary concerns: ${student.needs.join(", ")}`}
               </CardContent>
           </Card>

           <Tabs defaultValue="notes" className="flex-1 flex flex-col">
               <TabsList className="w-full justify-start">
                   <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                   <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
                   <TabsTrigger value="actions">Actions & Case</TabsTrigger>
               </TabsList>

               <TabsContent value="notes" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 h-full min-h-[400px]">
                   <div className="flex flex-col gap-4 h-full">
                       <Card className="flex-1 flex flex-col">
                           <CardHeader className="py-2 bg-muted/30"><CardTitle className="text-xs font-semibold uppercase">Observations</CardTitle></CardHeader>
                           <Textarea 
                               className="flex-1 border-0 resize-none p-3" 
                               placeholder="Record behaviors, appearance, affect..." 
                               value={observationNotes}
                               onChange={(e) => setObservationNotes(e.target.value)}
                           />
                       </Card>
                       <Card className="flex-1 flex flex-col">
                           <CardHeader className="py-2 bg-muted/30"><CardTitle className="text-xs font-semibold uppercase">Diagnosis & Impression</CardTitle></CardHeader>
                           <Textarea 
                               className="flex-1 border-0 resize-none p-3" 
                               placeholder="Potential diagnosis, risk factors..." 
                               value={diagnosisNotes}
                               onChange={(e) => setDiagnosisNotes(e.target.value)}
                           />
                       </Card>
                   </div>
                   
                   <Card className="flex flex-col h-full">
                       <CardHeader className="py-3 bg-muted/30">
                           <CardTitle className="text-sm">Live Transcript</CardTitle>
                       </CardHeader>
                       <ScrollArea className="flex-1 p-4">
                           <div className="text-sm leading-loose whitespace-pre-wrap">
                               {transcript ? (
                                   <span className="text-foreground">{transcript}</span>
                               ) : (
                                   <span className="text-muted-foreground italic">Start recording to see live transcription...</span>
                               )}
                               {listening && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />}
                           </div>
                       </ScrollArea>
                   </Card>
               </TabsContent>

               <TabsContent value="treatment" className="mt-4">
                   <Card><CardContent className="p-8 text-center text-muted-foreground italic">Treatment plan features will be available after the initial assessment is finalized.</CardContent></Card>
               </TabsContent>

               <TabsContent value="actions" className="mt-4">
                   <div className="grid grid-cols-2 gap-4">
                       <Card className="p-6 text-center cursor-pointer hover:bg-muted border-dashed border-2 transition-colors">
                           <FolderPlus className="mx-auto h-8 w-8 mb-2 text-primary" />
                           <h3 className="font-semibold">Create Case</h3>
                           <p className="text-xs text-muted-foreground">Transition this session into a longitudinal case.</p>
                       </Card>
                       <Card className="p-6 text-center cursor-pointer hover:bg-muted border-dashed border-2 transition-colors">
                           <ClipboardList className="mx-auto h-8 w-8 mb-2 text-indigo-500" />
                           <h3 className="font-semibold">Assign Assessment</h3>
                           <p className="text-xs text-muted-foreground">Select a psychometric battery for the student.</p>
                       </Card>
                   </div>
               </TabsContent>
           </Tabs>
       </div>

       {/* Sidebar AI Insights */}
       <div className="w-full md:w-[350px] border-l bg-slate-50 p-4 flex flex-col gap-4">
           <div className="flex items-center gap-2 pb-2 border-b">
               <BrainCircuit className="h-5 w-5 text-indigo-600" />
               <h2 className="font-semibold text-sm">Co-Pilot Insights</h2>
               {aiLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
           </div>
           <ScrollArea className="flex-1">
               <div className="space-y-4">
                   {aiSuggestions.length === 0 && !aiLoading && (
                       <p className="text-xs text-muted-foreground text-center py-8 italic">Listening for clinical markers...</p>
                   )}
                   {aiSuggestions.map((insight, i) => (
                       <Card key={i} className="border-l-4 border-l-indigo-500 shadow-sm">
                           <CardContent className="p-3">
                               <div className="flex justify-between items-start mb-1">
                                    <Badge variant="secondary" className="text-[9px] uppercase">{insight.type}</Badge>
                                    <span className="text-[9px] text-muted-foreground">{insight.confidence} conf.</span>
                               </div>
                               <p className="text-sm font-medium leading-tight">{insight.text}</p>
                               <Button size="sm" variant="outline" className="mt-2 w-full h-7 text-[10px] bg-white border-indigo-100 hover:bg-indigo-50" onClick={() => acceptInsight(insight.text, insight.type)}>Accept to Notes</Button>
                           </CardContent>
                       </Card>
                   ))}
               </div>
           </ScrollArea>
       </div>
    </div>
  );
}
