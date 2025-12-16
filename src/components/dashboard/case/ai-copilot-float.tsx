"use client";

import { useState } from "react";
import { Case } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Bot, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AICopilotFloatProps {
  context: {
    type: 'case';
    data: Case;
    activeTab: string;
  };
}

export function AICopilotFloat({ context }: AICopilotFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: `Hello! I'm analyzing the ${context.activeTab} for ${context.data.title}. How can I assist you?` }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Mock AI Response
    setTimeout(() => {
      let response = "I can help with that.";
      if (context.activeTab === 'assessments') {
        response = "Based on the Vanderbilt scores, I recommend looking into behavioral interventions.";
      } else if (context.activeTab === 'iep') {
        response = "The current reading goal seems a bit ambitious given the recent progress. Shall I draft a revised objective?";
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    }, 1000);
    
    setInput("");
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] h-[500px] shadow-2xl z-50 flex flex-col border-primary/20">
      <CardHeader className="bg-primary/5 p-3 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-sm">Case Co-Pilot</h4>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "max-w-[85%] rounded-lg p-3 text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Input 
            placeholder="Ask AI..." 
            className="flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          AI has access to {context.activeTab} context.
        </p>
      </div>
    </Card>
  );
}
