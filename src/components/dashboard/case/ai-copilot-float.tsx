"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, X, Bot, FileText, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface CopilotMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    citations?: { label: string; snippet?: string }[];
}

interface CopilotFloatProps {
    contextMode?: 'general' | 'student' | 'case';
    contextId?: string;
}

export function CopilotFloat({ contextMode = 'general', contextId }: CopilotFloatProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<CopilotMessage[]>([
        { id: 'welcome', role: 'assistant', text: 'Hi! I can help you find policies, summarize cases, or draft reports.' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMsg: CopilotMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const chatFn = httpsCallable<any, any>(functions, 'chatWithCopilot');
            const result = await chatFn({
                sessionId,
                message: userMsg.text,
                contextMode,
                contextId
            });

            if (result.data.sessionId) setSessionId(result.data.sessionId);

            const botMsg: CopilotMessage = {
                id: result.data.message.id,
                role: 'assistant',
                text: result.data.message.text,
                citations: result.data.message.citations
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            console.error("Copilot Error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to get response.",
                variant: "destructive"
            });
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) {
        return (
            <Button 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white z-50 transition-all hover:scale-105"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className={`fixed right-6 bottom-6 z-50 flex flex-col shadow-2xl border-indigo-100 transition-all duration-300 ${isMinimized ? 'h-16 w-72' : 'h-[600px] w-[400px]'}`}>
            {/* Header */}
            <div className="p-3 bg-indigo-600 text-white flex justify-between items-center rounded-t-lg shrink-0 cursor-pointer" onClick={() => !isMinimized && setIsMinimized(true)}>
                <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
                    <Bot className="h-5 w-5" />
                    <div>
                        <h3 className="font-semibold text-sm">MindKindler Copilot</h3>
                        {!isMinimized && <p className="text-[10px] text-indigo-200 opacity-90">Powered by Guardian AI</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-indigo-500" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-indigo-500" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <ScrollArea className="flex-1 p-4 bg-gray-50">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-white text-gray-800 border rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                                {msg.citations.map((cit, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        <FileText className="h-3 w-3" />
                                                        <span className="truncate max-w-[150px]">{cit.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                        <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t bg-white">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Ask about a case or policy..." 
                                className="flex-1 text-sm"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isThinking}
                            />
                            <Button size="icon" className="shrink-0 bg-indigo-600 hover:bg-indigo-700" onClick={handleSend} disabled={isThinking}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}
