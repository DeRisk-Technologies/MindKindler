"use client";

import { useState } from "react";
import { Case, Message } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, Paperclip, MoreVertical } from "lucide-react";

interface CaseMessagesProps {
  caseData: Case;
}

export function CaseMessages({ caseData }: CaseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      caseId: caseData.id,
      senderId: "p1", // Parent
      content: "Hello Dr. Smith, I'm worried about John's homework yesterday.",
      timestamp: new Date(Date.now() - 10000000).toISOString(),
    },
    {
      id: "m2",
      caseId: caseData.id,
      senderId: "u1", // EPP
      content: "Hi Mrs. Doe. Can you tell me more about what happened?",
      timestamp: new Date(Date.now() - 9000000).toISOString(),
    }
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      caseId: caseData.id,
      senderId: "current_user",
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Sidebar / Thread List (for future multi-thread support) */}
      <div className="w-80 border-r bg-muted/10 hidden md:flex md:flex-col">
        <div className="p-4 border-b">
           <Input placeholder="Search messages..." />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-md cursor-pointer">
               <Avatar>
                 <AvatarFallback>CT</AvatarFallback>
               </Avatar>
               <div className="overflow-hidden">
                 <p className="font-medium truncate">Care Team</p>
                 <p className="text-xs text-muted-foreground truncate">Dr. Smith: Hi Mrs. Doe...</p>
               </div>
            </div>
            <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-md cursor-pointer">
               <Avatar>
                 <AvatarFallback>MJ</AvatarFallback>
               </Avatar>
               <div className="overflow-hidden">
                 <p className="font-medium truncate">Mr. Johnson (Teacher)</p>
                 <p className="text-xs text-muted-foreground truncate">Submitted weekly report.</p>
               </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
           <div className="flex items-center gap-3">
             <Avatar>
               <AvatarFallback>CT</AvatarFallback>
             </Avatar>
             <div>
               <p className="font-medium">Care Team</p>
               <p className="text-xs text-muted-foreground">Parent, Teacher, Psychologist</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
           </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === 'current_user' || msg.senderId === 'u1'; // Mock logic
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.senderId === 'p1' ? 'P' : 'Dr'}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] rounded-lg p-3 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
            <Input 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
