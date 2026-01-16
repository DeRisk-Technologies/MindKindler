'use client';

import { ChatLayout } from "@/components/chat/ChatLayout";
import { AppShell } from "@/components/layout/AppShell";

export default function MessagesPage() {
  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Secure Messaging</h1>
                <p className="text-muted-foreground mt-1">
                    Encrypted, region-locked communication with PII protection.
                </p>
            </div>
        </div>
        <ChatLayout />
      </div>
    </AppShell>
  );
}
