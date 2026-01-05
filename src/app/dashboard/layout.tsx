"use client";

import { useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CopilotFloat } from "@/components/dashboard/case/ai-copilot-float";

const FUNCTIONS_REGION = "europe-west3";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // FIX: Use explicit region instead of custom domain
                const functionsInstance = getFunctions(undefined, FUNCTIONS_REGION);
                const setupProfile = httpsCallable(functionsInstance, 'setupUserProfile');
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
        {/* Replaced old AIAssistantFloat with CopilotFloat */}
        <CopilotFloat contextMode="general" /> 
      </div>
    </SidebarProvider>
  );
}
