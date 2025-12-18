"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFunctions, httpsCallable } from "firebase/functions";

const FUNCTIONS_BASE_URL = "https://europe-west3-studio-1557923276-46e4b.cloudfunctions.net";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAiSeeding, setIsAiSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSeed = async (mode: 'basic' | 'ai') => {
    if (!confirm(mode === 'ai' ? "This will generate complex AI scenarios. It may take up to 30 seconds." : "This will add basic mock data. Continue?")) return;
    
    if (mode === 'basic') setIsSeeding(true);
    else setIsAiSeeding(true);

    try {
      if (mode === 'basic') {
          // Client-side simple seed
          const { seedDatabase } = await import("@/lib/scripts/seed");
          await seedDatabase();
          toast({ title: "Success", description: "Basic mock data added." });
      } else {
          // Server-side AI seed
          const functions = getFunctions(); 
          functions.customDomain = FUNCTIONS_BASE_URL; // Set the custom domain
          const seedDemoData = httpsCallable(functions, 'seedDemoData');
          await seedDemoData();
          toast({ title: "AI Seed Complete", description: "Complex student profiles generated." });
      }
    } catch (e: any) {
       console.error(e);
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSeeding(false);
      setIsAiSeeding(false);
    }
  };

  const handleClear = async () => {
      if (!confirm("Are you sure? This will delete ALL demo students and cases created by the seed script.")) return;
      setIsClearing(true);
      try {
          const functions = getFunctions(); 
          functions.customDomain = FUNCTIONS_BASE_URL; // Set the custom domain
          const clearDemoData = httpsCallable(functions, 'clearDemoData');
          const result: any = await clearDemoData();
          
          if (result.data.success) {
              toast({ title: "Data Cleared", description: result.data.message });
          } else {
              throw new Error(result.data.message);
          }
      } catch (e: any) {
          toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
          setIsClearing(false);
      }
  };

  return (
    <div className="space-y-8 p-8 pt-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
            <p className="text-muted-foreground">Manage your account and platform preferences.</p>
        </div>

        {/* Existing settings placeholders */}
        
       <Card className="border-l-4 border-l-blue-500 bg-slate-50 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>
              Utilities for populating the platform with test data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
             <Button onClick={() => handleSeed('basic')} disabled={isSeeding || isAiSeeding || isClearing} variant="outline">
               {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
               Basic Data
             </Button>
             
             <Button onClick={() => handleSeed('ai')} disabled={isSeeding || isAiSeeding || isClearing} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
               {isAiSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
               Generate AI Scenarios
             </Button>

             <Button onClick={handleClear} disabled={isSeeding || isAiSeeding || isClearing} variant="destructive" className="ml-auto">
               {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
               Clear Demo Data
             </Button>
          </CardContent>
        </Card>
    </div>
  );
}
