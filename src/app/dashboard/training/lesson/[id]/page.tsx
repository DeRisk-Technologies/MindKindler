// src/app/dashboard/training/lesson/[id]/page.tsx

"use client";

import React, { use, useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { TrainingModule } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, Bot, User, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { QuizRunner } from '@/components/training/QuizRunner';
import { completeTrainingModule } from '@/app/actions/training';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [module, setModule] = useState<TrainingModule | null>(null);
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: "Hello! I'm your AI Tutor. Feel free to ask questions about the lesson material."}]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Fetch Module Data
    useEffect(() => {
        if (!id) return;
        async function loadModule() {
            const snap = await getDoc(doc(db, 'trainingModules', id));
            if (snap.exists()) setModule({ id: snap.id, ...snap.data() } as TrainingModule);
        }
        loadModule();
    }, [id]);

    const activeChapter = module?.content?.[activeChapterIndex];

    const handleNext = async () => {
        if (!module) return;
        
        const nextIndex = activeChapterIndex + 1;
        if (nextIndex < module.content.length) {
            setActiveChapterIndex(nextIndex);
            const progress = Math.round((nextIndex / module.content.length) * 100);
            await updateDoc(doc(db, 'trainingModules', module.id), { progressPercent: progress });
        } else {
            // If the last chapter wasn't a quiz (e.g. just reading), mark complete here
            if (activeChapter?.type !== 'quiz') {
                await updateDoc(doc(db, 'trainingModules', module.id), { status: 'completed', progressPercent: 100 });
                router.push('/dashboard/training/my-learning');
            }
        }
    };

    const handleQuizComplete = async (score: number, passed: boolean) => {
        if (!module || !user) return;
        
        try {
            const result = await completeTrainingModule(user.uid, module.id, score, passed);
            if (result.success) {
                toast({ 
                    title: passed ? "Module Completed!" : "Quiz Finished", 
                    description: passed ? "Certificate has been issued to your profile." : "Review the material and try again." 
                });
                if (passed) {
                    setTimeout(() => router.push('/dashboard/training/my-learning'), 2000);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !activeChapter) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput("");
        setIsSending(true);

        try {
            const chatFn = httpsCallable(functions, 'chatWithCopilot');
            const result: any = await chatFn({
                message: userMsg,
                contextMode: 'general', 
                additionalContext: `Current Lesson: ${activeChapter.title}. Content: ${activeChapter.textContent?.substring(0, 1000)}...`
            });

            setMessages(prev => [...prev, { role: 'assistant', text: result.data.message.text }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting to the tutor service." }]);
        } finally {
            setIsSending(false);
        }
    };

    if (!module) return <div className="p-8">Loading lesson...</div>;

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">{module.title}</h1>
                        <p className="text-xs text-muted-foreground">{activeChapter?.title} ({activeChapterIndex + 1}/{module.content.length})</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700">AI Generated Course</Badge>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Content Viewer or Quiz */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden max-w-4xl mx-auto w-full">
                    <Card className="flex-1 flex flex-col shadow-md border-indigo-100 h-full">
                        <CardHeader className="border-b bg-white">
                            <CardTitle className="flex justify-between items-center">
                                <span>{activeChapter?.title}</span>
                                {activeChapter?.type === 'quiz' && <Badge variant="secondary">Assessment</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-8 bg-white">
                            {activeChapter?.type === 'quiz' ? (
                                <QuizRunner lesson={activeChapter} onComplete={handleQuizComplete} />
                            ) : (
                                <div className="prose prose-slate max-w-none">
                                    {activeChapter?.textContent ? (
                                        <div dangerouslySetInnerHTML={{ __html: activeChapter.textContent.replace(/\n/g, '<br/>') }} />
                                    ) : (
                                        <p className="text-slate-400 italic">No content available for this chapter.</p>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                        
                        {/* Hide Next button if it's a quiz, let QuizRunner handle completion/next logic or just show previous */}
                        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                            <Button variant="ghost" disabled={activeChapterIndex === 0} onClick={() => setActiveChapterIndex(prev => prev - 1)}>
                                Previous
                            </Button>
                            {activeChapter?.type !== 'quiz' && (
                                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNext}>
                                    {activeChapterIndex === module.content.length - 1 ? 'Finish Lesson' : 'Next Chapter'}
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: AI Tutor */}
                <div className="w-[350px] border-l bg-white flex flex-col shadow-xl z-10">
                    <div className="p-3 border-b bg-indigo-50/50 flex items-center gap-2">
                        <Bot className="h-5 w-5 text-indigo-600" />
                        <span className="font-semibold text-sm text-indigo-900">AI Tutor</span>
                    </div>
                    
                    <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100'}`}>
                                        {msg.role === 'user' ? <User className="h-4 w-4"/> : <Bot className="h-4 w-4 text-indigo-600"/>}
                                    </div>
                                    <div className={`text-sm p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border shadow-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot className="h-4 w-4 text-indigo-600"/></div>
                                    <div className="text-sm p-3 rounded-lg bg-white border shadow-sm text-muted-foreground animate-pulse">Thinking...</div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t bg-white">
                        <div className="relative">
                            <Textarea 
                                placeholder="Ask about this chapter..." 
                                className="min-h-[50px] pr-10 resize-none text-sm"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            />
                            <Button 
                                size="icon" 
                                className="absolute bottom-2 right-2 h-6 w-6" 
                                onClick={handleSendMessage}
                                disabled={isSending || !input.trim()}
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
