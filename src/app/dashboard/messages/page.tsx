"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone, Video, MoreVertical, Search, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock Data for Prototype
const MOCK_CHATS = [
    { id: '1', name: 'Dr. Sarah & Parent (Alice)', lastMsg: 'Sounds good, see you then.', time: '10:30 AM', unread: 2 },
    { id: '2', name: 'School Admin Team', lastMsg: 'Report uploaded.', time: 'Yesterday', unread: 0 },
    { id: '3', name: 'Support', lastMsg: 'How can we help?', time: 'Mon', unread: 0 },
];

const MOCK_MESSAGES = [
    { id: '1', text: 'Hello, I wanted to confirm the appointment time.', sender: 'parent', time: '10:00 AM' },
    { id: '2', text: 'Hi! Yes, we are scheduled for 2pm on Thursday.', sender: 'me', time: '10:05 AM' },
    { id: '3', text: 'Great, will this be on Zoom?', sender: 'parent', time: '10:15 AM' },
    { id: '4', text: 'Yes, I will send the secure link shortly.', sender: 'me', time: '10:20 AM' },
];

export default function MessagesPage() {
    const [selectedChat, setSelectedChat] = useState<string | null>('1');
    const [inputText, setInputText] = useState('');

    return (
        <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-white shadow-sm">
            
            {/* Sidebar */}
            <div className="w-80 border-r flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search chats..." className="pl-8 bg-gray-50" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {MOCK_CHATS.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => setSelectedChat(chat.id)}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedChat === chat.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
                        >
                            <Avatar>
                                <AvatarFallback>{chat.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold text-sm truncate">{chat.name}</span>
                                    <span className="text-[10px] text-gray-500">{chat.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="h-5 w-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full">
                                    {chat.unread}
                                </div>
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-white h-16">
                    <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm">Dr. Sarah & Parent (Alice)</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online
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
                        {MOCK_MESSAGES.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                                    msg.sender === 'me' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
                                }`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {msg.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 bg-white border-t">
                    <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-4 w-4 text-gray-500" /></Button>
                        <Input 
                            value={inputText} 
                            onChange={(e) => setInputText(e.target.value)} 
                            placeholder="Type a message..." 
                            className="flex-1"
                        />
                        <Button size="icon" className="shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" /> Messages are monitored by AI Guardian for safety.
                    </div>
                </div>
            </div>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
