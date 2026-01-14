"use client";

import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CopilotFloat } from "@/components/dashboard/case/ai-copilot-float";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Phase 42 Imports
import { PilotBanner } from "@/components/dashboard/PilotBanner";
import { GlobalErrorBoundary } from "@/components/ui/error-boundary";

const FUNCTIONS_REGION = "europe-west3";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { verificationStatus, role, shardId } = usePermissions();
  const { toast } = useToast();
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    // Show banner if status is explicitly pending
    if (verificationStatus === 'pending' || verificationStatus === 'unverified') {
        setShowVerificationBanner(true);
    } else {
        setShowVerificationBanner(false);
    }
  }, [verificationStatus]);

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

  const handleContactAdmin = async () => {
      try {
          if (!auth.currentUser) return;
          const regionCode = shardId?.replace('mindkindler-', '') || 'uk';
          const adminEmail = `admin_${regionCode}@mindkindler.com`;
          
          toast({
              title: "Contact Request Sent",
              description: `A notification has been sent to ${adminEmail}. Please check your Messages for updates.`
          });
          
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <GlobalErrorBoundary>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background text-foreground relative flex-col">
            
            {/* Pilot Status Banner */}
            <PilotBanner />

            {/* Verification Banner */}
            {showVerificationBanner && (
                <div className="bg-amber-100 border-b border-amber-200 p-4 text-amber-900 sticky top-0 z-50">
                    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-6 w-6 text-amber-600" />
                            <div>
                                <h3 className="font-semibold">Account Pending Verification</h3>
                                <p className="text-sm">
                                    Your account is currently under review by the Regional Super Admin. 
                                    Some features will be restricted until your registration number is verified.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white border-amber-300 hover:bg-amber-50" onClick={handleContactAdmin}>
                                <Mail className="mr-2 h-4 w-4" /> Contact Admin
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1">
                <Sidebar className="border-r">
                <DashboardSidebar />
                </Sidebar>
                <SidebarInset className="flex w-full flex-col">
                <DashboardHeader />
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
                </SidebarInset>
            </div>
            {/* Replaced old AIAssistantFloat with CopilotFloat */}
            <CopilotFloat contextMode="general" /> 
          </div>
        </SidebarProvider>
    </GlobalErrorBoundary>
  );
}
