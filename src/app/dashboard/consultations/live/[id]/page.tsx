// src/app/dashboard/consultations/live/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { use } from 'react'; 
import { 
    Mic, MicOff, AlertCircle, ChevronRight, 
    LayoutDashboard, FileText, User, 
    BrainCircuit, Sparkles, MessageSquare, TabletSmartphone, Video, Loader2, CheckCircle,
    UserCircle, GraduationCap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// PHASE 21: New Components
import { LiveCockpit } from '@/components/consultations/LiveCockpit';
import { analyzeSegmentAction, AiInsight, ConsultationMode } from '@/app/actions/consultation';

// FIREBASE IMPORTS
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getRegionalDb, db as globalDb, functions } from '@/lib/firebase'; 
import { useAuth } from '@/hooks/use-auth';
import { httpsCallable } from 'firebase/functions';

// --- Types ---

interface TranscriptSegment {
    id: string;
    speaker: 'EPP' | 'Student' | 'Parent' | 'Event'; 
    text: string;
    timestamp: Date;
    isFinal: boolean;
}

const INITIAL_TRANSCRIPT: TranscriptSegment[] = [
    { id: '1', speaker: 'EPP', text: "Hello, it's good to see you again. How have you been since our last chat?", timestamp: new Date(), isFinal: true },
    { id: '2', speaker: 'Student', text: "I've been okay, I guess. School is a bit stressful.", timestamp: new Date(), isFinal: true },
];

export default function LiveConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter(); 
    const { toast } = useToast();
    const { user } = useAuth(); 
    
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [mode, setMode] = useState<ConsultationMode>('person_centered');
    const [transcript, setTranscript] = useState<TranscriptSegment[]>(INITIAL_TRANSCRIPT);
    const [interimText, setInterimText] = useState<string>(""); 
    const [insights, setInsights] = useState<AiInsight[]>([]);
    const [studentContext, setStudentContext] = useState<any>(null); 
    const [isSaving, setIsSaving] = useState(false);
    const [activeShard, setActiveShard] = useState<string>('default');
    
    // Active Speaker Toggle
    const [activeSpeaker, setActiveSpeaker] = useState<'EPP' | 'Student'>('EPP');

    // Refs
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); 

    // Load Session Context
    useEffect(() => {
        async function loadContext() {
            if (!user) return; 

            try {
                let region = user.region;
                if (!region || region === 'default') {
                    const routingRef = doc(globalDb, 'user_routing', user.uid);
                    const routingSnap = await getDoc(routingRef);
                    if (routingSnap.exists()) {
                        region = routingSnap.data().region;
                    } else if (user.email?.toLowerCase().includes('uk')) {
                        region = 'uk';
                    }
                }

                console.log(`[Consultation] Resolved Region: ${region}`);
                setActiveShard(region || 'default');

                const regionalDb = getRegionalDb(region);
                const sessionRef = doc(regionalDb, 'consultation_sessions', id);
                const sessionSnap = await getDoc(sessionRef);
                
                if (sessionSnap.exists()) {
                    const data = sessionSnap.data();
                    
                    // Set Mode if saved (e.g. from creation screen)
                    if (data.mode) setMode(data.mode);

                    if (data.studentId) {
                        const studentRef = doc(regionalDb, 'students', data.studentId);
                        const studentSnap = await getDoc(studentRef);
                        if (studentSnap.exists()) {
                            setStudentContext(studentSnap.data());
                        }
                    }
                    if (data.transcript && Array.isArray(data.transcript)) {
                        const resumed = data.transcript.map((t: any) => ({
                            ...t,
                            timestamp: t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp)
                        }));
                        setTranscript(resumed);
                    }
                }
            } catch (e) {
                console.error("Failed to load session context", e);
            }
        }
        loadContext();
    }, [id, user]);

    // Auto-scroll
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, interimText, insights]); 

    // --- Core Logic: Process Transcript & Trigger AI ---
    const handleFinalTranscript = async (text: string) => {
        const newSegment: TranscriptSegment = {
            id: Date.now().toString(),
            speaker: activeSpeaker, 
            text: text,
            timestamp: new Date(),
            isFinal: true
        };

        setTranscript(prev => [...prev, newSegment]);
        setInterimText(""); 

        // Trigger Co-Pilot (Cloud Function)
        try {
            const analyzeFn = httpsCallable(functions, 'analyzeConsultationInsight');
            const result = await analyzeFn({
                transcriptChunk: text,
                tenantId: user?.tenantId,
                studentId: studentContext?.id,
                context: mode
            });
            
            const newInsight = result.data as AiInsight;
            
            if (newInsight && newInsight.type !== 'none') {
                setInsights(prev => [newInsight, ...prev]);
                toast({ title: "AI Suggestion", description: newInsight.text, duration: 4000 });
            }
        } catch (e) {
            console.error("AI Action failed", e);
        }
    };

    // --- Web Speech API Setup ---
    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            setInterimText("");
        } else {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                toast({ title: "Not Supported", description: "Use Chrome.", variant: "destructive" });
                return;
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = true; 
            recognition.lang = 'en-GB';
            
            recognition.onstart = () => console.log("Speech started");
            
            recognition.onerror = (event: any) => {
                if (event.error === 'not-allowed') {
                    toast({ variant: "destructive", title: "Mic Access Denied" });
                    setIsRecording(false);
                }
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let currentInterim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) handleFinalTranscript(finalTranscript);
                if (currentInterim) setInterimText(currentInterim);
            };
            
            try {
                recognition.start();
                recognitionRef.current = recognition;
                setIsRecording(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    // --- Actions ---
    const pushToTablet = (command: string) => {
        toast({ title: "Sent to Tablet", description: `Command: ${command}` });
    };

    const handleEndSession = async () => {
        if (isSaving || !user) return;
        setIsSaving(true);

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        try {
            const db = getRegionalDb(activeShard);
            const sessionRef = doc(db, 'consultation_sessions', id);
            await updateDoc(sessionRef, {
                transcript: transcript.map(t => ({ ...t, timestamp: t.timestamp.toISOString() })),
                insights: insights,
                status: 'completed',
                endedAt: new Date().toISOString(),
                mode: mode
            });

            toast({ title: "Session Saved", description: "Redirecting..." });
            router.push(`/dashboard/consultations/synthesis/${id}`);
        } catch (error) {
            console.error("Failed to save session", error);
            toast({ title: "Error Saving", variant: "destructive" });
            setIsSaving(false);
        }
    };

    // Handler for Live Cockpit Observations
    const handleLiveObservation = (label: string) => {
        // Log observation into the transcript stream as an event
        const obsSegment: TranscriptSegment = {
            id: Date.now().toString(),
            speaker: 'Event',
            text: `Observation: ${label}`,
            timestamp: new Date(),
            isFinal: true
        };
        setTranscript(prev => [...prev, obsSegment]);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
            
            {/* 1. Header Bar */}
            <header className="flex-none bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Badge variant={isRecording ? "destructive" : "secondary"} className="animate-pulse">
                        {isRecording ? "● LIVE RECORDING" : "● PAUSED"}
                    </Badge>
                    <h1 className="text-lg font-bold text-slate-800">Session #{id.substring(0, 6)}</h1>
                    <Separator orientation="vertical" className="h-6" />
                    
                    {/* Active Speaker Toggle */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border">
                        <Button 
                            variant={activeSpeaker === 'EPP' ? "default" : "ghost"} 
                            size="sm" 
                            className={`h-7 px-3 text-xs ${activeSpeaker === 'EPP' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                            onClick={() => setActiveSpeaker('EPP')}
                        >
                            <UserCircle className="w-3 h-3 mr-1" /> EPP
                        </Button>
                        <Button 
                            variant={activeSpeaker === 'Student' ? "default" : "ghost"} 
                            size="sm" 
                            className={`h-7 px-3 text-xs ${activeSpeaker === 'Student' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                            onClick={() => setActiveSpeaker('Student')}
                        >
                            <GraduationCap className="w-3 h-3 mr-1" /> Student
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="secondary" size="sm" className="hidden md:flex">
                                <TabletSmartphone className="mr-2 h-4 w-4" /> Tablet
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => pushToTablet('show_emotion_scale')}>Show Emotion Scale</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => pushToTablet('show_reaction_cards')}>Show Reaction Cards</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="h-6 mx-2" />

                    <Button 
                        variant={isVideoActive ? "default" : "outline"}
                        size="icon"
                        onClick={() => setIsVideoActive(!isVideoActive)}
                    >
                        <Video className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                        variant={isRecording ? "destructive" : "default"}
                        size="sm"
                        onClick={toggleRecording}
                        className="w-32 transition-all"
                    >
                        {isRecording ? <><MicOff className="mr-2 h-4 w-4" /> Stop</> : <><Mic className="mr-2 h-4 w-4" /> Record</>}
                    </Button>

                    <Separator orientation="vertical" className="h-6 mx-2" />

                    <Button 
                        variant="default"
                        size="sm"
                        onClick={handleEndSession}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        End Session
                    </Button>
                </div>
            </header>

            {/* 2. Main Workspace */}
            <div className="flex-grow flex overflow-hidden">
                
                {/* Left Panel: Transcript & AI Stream (40%) */}
                <div className="w-5/12 flex flex-col border-r bg-white">
                    <div className="flex-grow flex flex-col min-h-0 relative">
                        <div className="p-3 bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                            <span className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Live Transcript</span>
                            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded">En-GB</span>
                        </div>
                        
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-6">
                                {transcript.map((seg) => {
                                    if (seg.speaker === 'Event') {
                                        return (
                                            <div key={seg.id} className="flex justify-center my-4">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                                                    {seg.text}
                                                </Badge>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={seg.id} className={`flex gap-3 ${seg.speaker === 'EPP' ? 'flex-row-reverse' : ''}`}>
                                            <Avatar className="w-8 h-8 mt-1">
                                                <AvatarFallback className={seg.speaker === 'EPP' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}>
                                                    {seg.speaker === 'EPP' ? 'EPP' : 'ST'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={`flex flex-col max-w-[85%] ${seg.speaker === 'EPP' ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                                                    seg.speaker === 'EPP' 
                                                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                                }`}>
                                                    {seg.text}
                                                </div>
                                                <span className="text-[10px] text-slate-400 mt-1 ml-1">
                                                    {seg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {interimText && (
                                    <div className={`flex gap-3 animate-pulse opacity-70 ${activeSpeaker === 'EPP' ? 'flex-row-reverse' : ''}`}>
                                        <Avatar className="w-8 h-8 mt-1 opacity-50">
                                            <AvatarFallback>{activeSpeaker === 'EPP' ? 'EPP' : 'ST'}</AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col max-w-[85%] ${activeSpeaker === 'EPP' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed bg-slate-100 text-slate-600 italic`}>
                                                {interimText}...
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={transcriptEndRef} />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* AI Co-Pilot Stream */}
                    <div className="h-56 border-t bg-slate-50 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="p-2 border-b bg-indigo-950 text-white text-xs font-bold flex items-center gap-2 px-4 shadow-sm">
                            <BrainCircuit className="w-4 h-4 text-indigo-400" />
                            Gemini 2.0 Co-Pilot
                        </div>
                        <ScrollArea className="flex-grow p-3">
                            <div className="space-y-3">
                                {insights.map((insight) => (
                                    <div key={insight.id} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 group">
                                        <div className={`w-1 rounded-full flex-none mt-1 mb-1 ${
                                            insight.type === 'strength' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`} />
                                        <div className="flex-grow bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    {insight.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-snug">{insight.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Right Panel: Live Cockpit (Methodology Engine) */}
                <div className="w-7/12 flex flex-col bg-slate-100/50 p-4">
                    <Tabs defaultValue="cockpit" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start bg-white border mb-4 p-1 h-auto shadow-sm">
                            <TabsTrigger value="cockpit" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Live Cockpit
                            </TabsTrigger>
                            <TabsTrigger value="subject_360" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                <User className="w-4 h-4 mr-2" /> Subject 360
                            </TabsTrigger>
                            <TabsTrigger value="files" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                <FileText className="w-4 h-4 mr-2" /> Evidence
                            </TabsTrigger>
                        </TabsList>

                        {/* Phase 21 Integration: Live Cockpit */}
                        <TabsContent value="cockpit" className="flex-grow flex flex-col min-h-0 mt-0">
                            <LiveCockpit 
                                sessionId={id}
                                initialMethodId={mode === 'person_centered' ? 'path_process' : 'maps_process'} // Auto-select method
                                onObservation={handleLiveObservation}
                            />
                        </TabsContent>

                        <TabsContent value="subject_360" className="flex-grow overflow-auto">
                            <Card className="h-full border-none shadow-sm">
                                <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-sm text-slate-500">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-slate-400">Name</Label>
                                                <div className="font-medium">{studentContext?.identity?.firstName?.value || 'Unknown'}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-400">SEN Status</Label>
                                                <div className="font-medium">{studentContext?.education?.senStatus?.value || 'None'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

            </div>
        </div>
    );
}
