"use client";

import { useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AIAssistantFloat } from "@/components/ai-assistant-float";

const FUNCTIONS_BASE_URL = "https://europe-west3-studio-1557923276-46e4b.cloudfunctions.net";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Use the explicit URL for the callable function
                const functionsInstance = getFunctions(); 
                // Ensure the region matches your deployment
                functionsInstance.customDomain = FUNCTIONS_BASE_URL; 

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
        <AIAssistantFloat />
      </div>
    </SidebarProvider>
  );
}
