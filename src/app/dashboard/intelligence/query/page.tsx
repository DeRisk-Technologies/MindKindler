"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, Sparkles, BookOpen, User, Loader2 } from "lucide-react";
import { retrieveContext, generateRAGResponse } from "@/ai/knowledge/retrieve";
import { KnowledgeChunk, KnowledgeDocument } from "@/types/schema";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: KnowledgeChunk[];
}

export default function AskVaultPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        setQuery("");

        try {
            // 1. Retrieve
            const context = await retrieveContext(query);
            
            // 2. Generate
            const answer = await generateRAGResponse(userMsg.content, context);

            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: answer,
                citations: context.map(c => c.chunk)
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="border-b p-4 bg-background z-10">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" /> Ask the Vault
                </h1>
                <p className="text-xs text-muted-foreground">Query Rulebooks, Reports, and Personal Rules.</p>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">What do you want to know?</h3>
                            <p className="text-sm">Ask about compliance rules, past cases, or your personal notes.</p>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <Avatar className="h-8 w-8 mt-1 border">
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700"><Sparkles className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                            )}
                            
                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`p-4 rounded-lg text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                    : 'bg-white border shadow-sm rounded-tl-none'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* Citations */}
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {msg.citations.map((cite, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-white hover:bg-slate-100 cursor-pointer text-[10px] flex items-center gap-1 border-indigo-200 text-indigo-700">
                                                <BookOpen className="h-3 w-3" /> Source {idx + 1}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback className="bg-slate-200"><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4">
                             <Avatar className="h-8 w-8 mt-1 border"><AvatarFallback><Sparkles className="h-4 w-4 animate-pulse" /></AvatarFallback></Avatar>
                             <div className="bg-white border p-4 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
                                 <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                 <span className="text-xs text-muted-foreground">Searching knowledge graph...</span>
                             </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <div className="max-w-3xl mx-auto relative">
                    <Input 
                        className="pr-12 h-12 text-base shadow-sm" 
                        placeholder="Ask a question..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-1 top-1 h-10 w-10" 
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="max-w-3xl mx-auto mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                    <span>Searching: Rulebooks, Reports, Personal Rules</span>
                </div>
            </div>
        </div>
    );
}
