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
import { Mic, MicOff, Save, FileText, BrainCircuit, CheckCircle2, XCircle, Sparkles, FolderPlus, ClipboardList, Stethoscope, History, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { generateConsultationReport } from "@/ai/flows/generate-consultation-report";
import { generateConsultationInsights } from "@/ai/flows/generate-consultation-insights";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import Link from "next/link";

export default function LiveConsultationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Note Splitting
  const [observationNotes, setObservationNotes] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]); 
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);
  
  // Treatment Plans
  const [treatmentPlans, setTreatmentPlans] = useState<string[]>([]);
  const [treatmentLoading, setTreatmentLoading] = useState(false);

  // New Case created ID
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  // Voice Recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            const sessionSnap = await getDoc(doc(db, "consultation_sessions", id as string));
            if (sessionSnap.exists()) {
                const sData = { id: sessionSnap.id, ...sessionSnap.data() } as ConsultationSession;
                setSession(sData);
                // Simple parsing for prototype if existing notes are single block
                setObservationNotes(sData.notes || "");
                
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

  // Real-time AI Analysis of Transcript
  useEffect(() => {
      if (listening && transcript.length - lastAnalyzedLength > 100) {
          const chunk = transcript.slice(lastAnalyzedLength);
          triggerAiAnalysis(chunk);
          setLastAnalyzedLength(transcript.length);
      }
  }, [transcript, listening, lastAnalyzedLength]);

  const toggleRecording = () => {
      if (listening) {
          SpeechRecognition.stopListening();
          toast({ title: "Paused", description: "Recording stopped." });
      } else {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
          toast({ title: "Listening...", description: "Speak clearly." });
      }
  };

  const triggerAiAnalysis = async (chunk: string) => {
      if(!student) return;
      setAiLoading(true);
      try {
          const result = await generateConsultationInsights({
              transcriptChunk: chunk,
              currentNotes: observationNotes + "\n" + diagnosisNotes,
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
      // Concatenate for backward compatibility or store as object
      const fullNotes = `OBSERVATIONS:\n${observationNotes}\n\nDIAGNOSIS:\n${diagnosisNotes}`;
      
      await updateDoc(doc(db, "consultation_sessions", session.id), {
          notes: fullNotes,
          transcript: transcript 
      });
      toast({ title: "Saved", description: "Session notes updated." });
  };

  const generateTreatmentPlan = async () => {
      setTreatmentLoading(true);
      // Simulate AI Latency
      setTimeout(() => {
          const mockPlans = [
              "Implement Tier 2 reading intervention focusing on phonemic awareness 3x/week.",
              "Refer for Occupational Therapy evaluation regarding fine motor delays.",
              "Classroom accommodation: Preferential seating away from distractions.",
              "Parent coaching session on positive reinforcement strategies."
          ];
          setTreatmentPlans(mockPlans);
          setTreatmentLoading(false);
          toast({ title: "Treatment Plans Generated", description: "Review and select options." });
      }, 2000);
  };

  const createCase = async () => {
      if (!student) return;
      try {
          const newCaseRef = await addDoc(collection(db, "cases"), {
              title: `Case for ${student.firstName} ${student.lastName}`,
              type: 'student',
              studentId: student.id,
              status: 'Open',
              priority: 'Medium',
              description: `Initiated from consultation on ${new Date().toLocaleDateString()}`,
              openedAt: new Date().toISOString(),
              activities: []
          });
          
          setCreatedCaseId(newCaseRef.id);
          toast({ 
              title: "Case Created", 
              description: "You can manage this in the Case Management module.",
              action: (
                  <Button size="sm" onClick={() => router.push(`/dashboard/cases/${newCaseRef.id}`)}>
                      View Case
                  </Button>
              )
          });
      } catch (e) {
          toast({ title: "Error", variant: "destructive" });
      }
  };

  const initiateAssessment = async () => {
      // Mock logic to create draft assessment
      toast({ title: "Assessment Initiated", description: "Draft assessment created. AI will include results." });
  };

  const acceptInsight = (text: string, type: string) => {
      if (type === 'risk' || type === 'diagnosis') {
          setDiagnosisNotes(prev => prev + "\n- " + text);
      } else {
          setObservationNotes(prev => prev + "\n- " + text);
      }
      toast({description: "Added to notes"});
  };

  const handleGenerateReport = async () => {
      if (!session || !student) return;
      toast({ title: "Generating Report", description: "AI is drafting the consultation summary..." });
      
      try {
          const reportData = await generateConsultationReport({ 
              studentName: `${student.firstName} ${student.lastName}`,
              age: new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear(),
              transcript: transcript,
              notes: `OBSERVATIONS: ${observationNotes} \n DIAGNOSIS: ${diagnosisNotes}`,
              historySummary: "See student history.",
              templateType: 'SOAP'
          });

          const reportDoc = await addDoc(collection(db, "reports"), {
              caseId: session.caseId,
              sessionId: session.id,
              studentId: student.id,
              title: reportData.title,
              sections: reportData.sections,
              generatedContent: reportData.summary,
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

  if (!browserSupportsSpeechRecognition) {
      return <div className="p-8 text-center">Browser does not support speech recognition. Please use Chrome.</div>;
  }

  if (loading || !session || !student) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

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
           
           <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
               <CardHeader className="py-3 flex flex-row items-center justify-between">
                   <CardTitle className="text-sm font-medium flex items-center text-blue-700 dark:text-blue-300">
                       <Sparkles className="mr-2 h-3 w-3" /> History Summary
                   </CardTitle>
                   <div className="flex gap-2">
                       <Button variant="ghost" size="sm" className="h-6 text-xs"><History className="mr-1 h-3 w-3" /> Past Cases</Button>
                       <Button variant="ghost" size="sm" className="h-6 text-xs"><BrainCircuit className="mr-1 h-3 w-3" /> DSM-5 Ref</Button>
                   </div>
               </CardHeader>
               <CardContent className="pb-3 text-sm text-muted-foreground">
                   Student has a history of {student.diagnosisCategory?.join(", ") || "reported concerns"}. 
                   Previous interventions: {student.history ? "Documented in file." : "None recorded."}
               </CardContent>
           </Card>

           <Tabs defaultValue="notes" className="flex-1 flex flex-col">
               <TabsList className="w-full justify-start">
                   <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                   <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
                   <TabsTrigger value="actions">Actions & Case</TabsTrigger>
               </TabsList>

               <TabsContent value="notes" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 h-full min-h-[400px]">
                   {/* Split Notes Editor */}
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
                           <CardHeader className="py-2 bg-muted/30"><CardTitle className="text-xs font-semibold uppercase">Diagnosis & Clinical Impression</CardTitle></CardHeader>
                           <Textarea 
                               className="flex-1 border-0 resize-none p-3" 
                               placeholder="Potential diagnosis, risk factors..." 
                               value={diagnosisNotes}
                               onChange={(e) => setDiagnosisNotes(e.target.value)}
                           />
                       </Card>
                   </div>
                   
                   {/* Live Transcript View */}
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

               <TabsContent value="treatment" className="mt-4 space-y-4">
                   <Card>
                       <CardHeader>
                           <CardTitle>Treatment Recommendations</CardTitle>
                           <CardDescription>AI-generated intervention strategies based on diagnosis.</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-4">
                           {treatmentPlans.length === 0 && !treatmentLoading && (
                               <div className="text-center py-8">
                                   <Button onClick={generateTreatmentPlan}>
                                       <Sparkles className="mr-2 h-4 w-4" /> Generate Treatment Plan
                                   </Button>
                               </div>
                           )}
                           
                           {treatmentLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}

                           {treatmentPlans.map((plan, i) => (
                               <div key={i} className="flex gap-2 items-start p-3 border rounded-md">
                                   <Textarea 
                                       className="min-h-[60px] flex-1 resize-none" 
                                       defaultValue={plan} 
                                   />
                                   <Button variant="ghost" size="icon" className="text-red-500"><XCircle className="h-4 w-4" /></Button>
                               </div>
                           ))}
                           {treatmentPlans.length > 0 && (
                               <Button variant="outline" onClick={() => setTreatmentPlans([...treatmentPlans, ""])}>
                                   <Plus className="mr-2 h-4 w-4" /> Add Manual Item
                               </Button>
                           )}
                       </CardContent>
                   </Card>
               </TabsContent>

               <TabsContent value="actions" className="mt-4 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={createCase}>
                           <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center">
                               <FolderPlus className="h-8 w-8 text-primary" />
                               <h3 className="font-semibold">Create Case File</h3>
                               <p className="text-sm text-muted-foreground">Open a formal case for longitudinal tracking.</p>
                               {createdCaseId && (
                                   <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-xs flex items-center">
                                       <CheckCircle2 className="h-3 w-3 mr-1"/> Case #{createdCaseId.slice(0,5)} Created
                                   </div>
                               )}
                           </CardContent>
                       </Card>
                       <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={initiateAssessment}>
                           <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center">
                               <ClipboardList className="h-8 w-8 text-indigo-500" />
                               <h3 className="font-semibold">Initiate Assessment</h3>
                               <p className="text-sm text-muted-foreground">Assign a standard or custom assessment battery.</p>
                           </CardContent>
                       </Card>
                   </div>
               </TabsContent>
           </Tabs>
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
                               
                               <div className="flex gap-2 pt-1">
                                   <Button size="sm" variant="outline" className="h-6 text-xs w-full border-green-200 hover:bg-green-50 text-green-700" onClick={() => acceptInsight(insight.text, insight.type)}>
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
       </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
