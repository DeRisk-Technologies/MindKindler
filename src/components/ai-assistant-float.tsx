"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bot, MessageSquare, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AIAssistantFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    
    // Mock response for now
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm processing that request. (This is a mock response)" }]);
    }, 1000);
    
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-300", 
              isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isOpen ? <X className="h-6 w-6 text-white" /> : <Bot className="h-8 w-8 text-white" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 h-96 p-0 mb-4 mr-2 shadow-2xl border-2 border-primary/20 overflow-hidden flex flex-col" align="end" sideOffset={10}>
          <div className="bg-primary p-3 flex items-center gap-2 text-primary-foreground">
             <Bot className="h-5 w-5" />
             <h3 className="font-semibold text-sm">MindKindler Assistant</h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    msg.role === "user" 
                      ? "ml-auto bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t bg-background flex gap-2">
            <Input 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} className="shrink-0">
               <Send className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
