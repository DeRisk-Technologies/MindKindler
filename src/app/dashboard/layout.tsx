"use client";

import { useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AIAssistantFloat } from "@/components/ai-assistant-float";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    // Attempt to set up user profile on every dashboard load (idempotent on backend)
    // ensuring profile exists even if trigger failed or user is new.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const functions = getFunctions(undefined, 'europe-west3');
                const setupProfile = httpsCallable(functions, 'setupUserProfile');
                await setupProfile();
            } catch (e) {
                console.error("Profile setup check failed (non-critical):", e);
            }
        }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground relative">
        <Sidebar className="border-r">
          <DashboardSidebar />
        </Sidebar>
        <SidebarInset className="flex w-full flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
        <AIAssistantFloat />
      </div>
    </SidebarProvider>
  );
}
