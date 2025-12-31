"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, History, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AIAssistantFloat } from "@/components/ai-assistant-float";

// This page now acts as a redirect/landing for the centralized floating messaging system
// Or serves as a "full screen" view if needed in the future.

export default function MessagesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6 h-[80vh] items-center justify-center text-center">
      <div className="max-w-md space-y-4">
        <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
             <MessageSquare className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Messaging Center</h1>
        <p className="text-muted-foreground">
            We have moved the messaging experience to the global assistant float for easier access from anywhere in the app.
        </p>
        <p className="text-sm text-muted-foreground italic">
            Look for the chat icon in the bottom right corner of your screen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => {
              // Trigger open float via custom event or context (if implemented)
              // For now, just a visual guide
          }}>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Users className="h-5 w-5" />
                      Find Colleagues
                  </CardTitle>
                  <CardDescription>Search and connect with other users</CardDescription>
              </CardHeader>
          </Card>
          
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                      <History className="h-5 w-5" />
                      Archive
                  </CardTitle>
                  <CardDescription>View past conversations (Coming Soon)</CardDescription>
              </CardHeader>
          </Card>
      </div>
    </div>
  );
}
