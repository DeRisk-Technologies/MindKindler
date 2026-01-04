"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Sparkles, BookOpen, ThumbsUp, ThumbsDown, RefreshCcw, History, Plus, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CopilotService, ChatMessage } from '@/services/copilot-service';
import { BotSession } from '@/types/schema';
import { format } from 'date-fns';

export default function CopilotPage() {
    const [sessions, setSessions] = useState<BotSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [contextMode, setContextMode] = useState<'general' | 'student' | 'case'>('general');

    // 1. Load History
    useEffect(() => {
        // In real app, get user ID from auth context
        CopilotService.getSessions('user-1').then(setSessions);
    }, []);

    // 2. Subscribe to Active Session
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([{
                id: 'intro', role: 'assistant', content: 'Hello! I am your Policy & Clinical Co-Pilot. Start a new chat to begin.', createdAt: new Date()
            }]);
            return;
        }

        const unsubscribe = CopilotService.subscribeToMessages(activeSessionId, (msgs) => {
            setMessages(msgs);
            setIsTyping(false); // Stop typing if new message arrives
        });
        return () => unsubscribe();
    }, [activeSessionId]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const txt = input;
        setInput('');
        setIsTyping(true);

        try {
            // Optimistic UI Update (optional, but subscription handles it fast usually)
            
            const result = await CopilotService.sendMessage(
                txt, 
                contextMode, 
                undefined, // contextId
                activeSessionId || undefined
            );

            if (!activeSessionId) {
                setActiveSessionId(result.sessionId);
                // Refresh sessions list
                CopilotService.getSessions('user-1').then(setSessions);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to send message. See console.");
            setIsTyping(false);
        }
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([{
            id: 'intro', role: 'assistant', content: 'Hello! I am your Policy & Clinical Co-Pilot. How can I assist with your casework today?', createdAt: new Date()
        }]);
    };

    return (
        <div className="h-[calc(100vh-80px)] flex border rounded-lg overflow-hidden bg-white shadow-sm">
            
            {/* Sidebar */}
            <div className="w-64 border-r flex flex-col bg-gray-50/50">
                <div className="p-4 border-b space-y-4">
                    <Button className="w-full justify-start gap-2" variant="default" onClick={startNewChat}>
                        <Plus className="h-4 w-4" /> New Chat
                    </Button>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context</label>
                        <Select value={contextMode} onValueChange={(v: any) => setContextMode(v)}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Select Context" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Policy</SelectItem>
                                <SelectItem value="student">Active Student</SelectItem>
                                <SelectItem value="case">Current Case</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        <label className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block mt-2">History</label>
                        {sessions.map(session => (
                            <Button 
                                key={session.id} 
                                variant={activeSessionId === session.id ? 'secondary' : 'ghost'} 
                                className="w-full justify-start text-sm h-auto py-2 px-3 truncate"
                                onClick={() => setActiveSessionId(session.id)}
                            >
                                <div className="flex flex-col items-start truncate">
                                    <span className="truncate w-full">Session {session.id.substring(0,6)}</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        {/* session.updatedAt is Firestore timestamp, need conversion in real app */}
                                        Recent
                                    </span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t text-xs text-center text-muted-foreground">
                    MindKindler AI v2.1
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="h-14 border-b flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h2 className="font-semibold text-sm">Policy & Clinical Co-Pilot</h2>
                        <Badge variant="outline" className="ml-2 text-[10px] font-normal text-purple-600 border-purple-200 bg-purple-50">
                            {contextMode === 'student' ? 'Student Context Active' : 'General Mode'}
                        </Badge>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className={`h-8 w-8 mt-1 border ${
                                    msg.role === 'assistant' ? 'bg-purple-100 border-purple-200' : 'bg-gray-100'
                                }`}>
                                    <AvatarFallback>
                                        {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-gray-600" />}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-xs font-semibold text-gray-700">
                                            {msg.role === 'assistant' ? 'MindKindler AI' : 'You'}
                                        </span>
                                    </div>

                                    <div className={`p-4 rounded-lg text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 ml-1">
                                            {msg.citations.map((cite, i) => (
                                                <TooltipProvider key={i}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-1.5 text-[10px] bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100 cursor-help hover:bg-purple-100 transition-colors">
                                                                <BookOpen className="h-3 w-3" />
                                                                {cite.label}
                                                            </div>
                                                        </TooltipTrigger>
                                                        {cite.snippet && <TooltipContent className="max-w-xs text-xs">{cite.snippet}</TooltipContent>}
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-4">
                                 <Avatar className="h-8 w-8 bg-purple-100 border border-purple-200"><AvatarFallback><Bot className="h-4 w-4 text-purple-600" /></AvatarFallback></Avatar>
                                 <div className="flex gap-1 items-center p-4 bg-white border border-gray-100 rounded-lg rounded-tl-none shadow-sm h-12">
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                                 </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t">
                    <div className="max-w-3xl mx-auto">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-3 relative items-end"
                        >
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Co-Pilot..." 
                                className="bg-gray-50 border-gray-200 focus:bg-white pr-10 min-h-[48px] py-3"
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={!input.trim() || isTyping} 
                                className="absolute right-1.5 top-1.5 h-9 w-9 bg-purple-600 hover:bg-purple-700 transition-all"
                            >
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
