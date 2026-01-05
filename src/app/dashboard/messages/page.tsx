"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone, Video, MoreVertical, Search, Paperclip, ShieldAlert, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { ChatService } from '@/services/messaging/chat-service';
import { ChatChannel, ChatMessage } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
    const { user, tenant } = useAuth();
    const { toast } = useToast();
    
    // State
    const [chats, setChats] = useState<ChatChannel[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Services
    const chatService = useRef<ChatService | null>(null);
    const scrollEndRef = useRef<HTMLDivElement>(null);

    // Initialize Service
    useEffect(() => {
        if (user && tenant) {
            chatService.current = new ChatService(tenant.id, user.uid);
            
            // Subscribe to Chats
            const unsubscribe = chatService.current.subscribeToChats((data) => {
                setChats(data);
                // Auto-select first chat if none selected
                if (!selectedChatId && data.length > 0) {
                    setSelectedChatId(data[0].id);
                }
            });
            return () => unsubscribe();
        }
    }, [user, tenant]);

    // Subscribe to Messages when Chat changes
    useEffect(() => {
        if (selectedChatId && chatService.current) {
            const unsubscribe = chatService.current.subscribeToMessages(selectedChatId, (data) => {
                setMessages(data);
                // Scroll to bottom
                setTimeout(() => scrollEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            });
            return () => unsubscribe();
        }
    }, [selectedChatId]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedChatId || !chatService.current) return;
        
        setIsSending(true);
        const result = await chatService.current.sendMessage(selectedChatId, inputText);
        setIsSending(false);

        if (result.success) {
            setInputText('');
        } else {
            toast({
                title: "Message Blocked",
                description: result.error,
                variant: "destructive"
            });
        }
    };

    // Derived State
    const activeChat = chats.find(c => c.id === selectedChatId);

    // Helpers
    const getChatName = (chat: ChatChannel) => {
        if (chat.name) return chat.name;
        // Logic to show other participant's name would go here (requires User Profile lookup)
        return chat.participantIds.filter(id => id !== user?.uid).join(', ') || 'Unknown Chat';
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return <div className="p-10 text-center">Please log in to view messages.</div>;

    return (
        <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-white shadow-sm">
            
            {/* Sidebar List */}
            <div className="w-80 border-r flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search chats..." className="pl-8 bg-gray-50" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {chats.length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
                    )}
                    {chats.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedChatId === chat.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
                        >
                            <Avatar>
                                <AvatarFallback>{getChatName(chat)[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold text-sm truncate">{getChatName(chat)}</span>
                                    {chat.lastMessage && (
                                        <span className="text-[10px] text-gray-500">{formatTime(chat.lastMessage.sentAt)}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {chat.lastMessage?.text || 'New conversation'}
                                </p>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-white h-16">
                            <div className="flex items-center gap-3">
                                 <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getChatName(activeChat)[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm">{getChatName(activeChat)}</h3>
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Encrypted
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon"><Phone className="h-4 w-4 text-gray-500" /></Button>
                                <Button variant="ghost" size="icon"><Video className="h-4 w-4 text-gray-500" /></Button>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-gray-500" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4 bg-gray-50">
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                                            msg.senderId === user.uid
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
                                        }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.senderId === user.uid ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2 items-center">
                                <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-4 w-4 text-gray-500" /></Button>
                                <Input 
                                    value={inputText} 
                                    onChange={(e) => setInputText(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..." 
                                    className="flex-1"
                                    disabled={isSending}
                                />
                                <Button size="icon" className="shrink-0" onClick={handleSendMessage} disabled={isSending}>
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                                <Shield className="h-3 w-3" /> Messages are monitored by AI Guardian for safety.
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
                        <Shield className="h-10 w-10 text-gray-200" />
                        <p>Select a chat to start messaging securely.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
