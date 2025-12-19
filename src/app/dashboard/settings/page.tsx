"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
    Database, 
    Loader2, 
    Sparkles, 
    Trash2, 
    Calendar, 
    Palette, 
    Bell, 
    Lock,
    Globe
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const FUNCTIONS_BASE_URL = "https://europe-west3-studio-1557923276-46e4b.cloudfunctions.net";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAiSeeding, setIsAiSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Seeding Logic (Developer Tools)
  const handleSeed = async (mode: 'basic' | 'ai') => {
    if (!confirm(mode === 'ai' ? "This will generate complex AI scenarios. It may take up to 30 seconds." : "This will add basic mock data. Continue?")) return;
    
    if (mode === 'basic') setIsSeeding(true);
    else setIsAiSeeding(true);

    try {
      if (mode === 'basic') {
          const { seedDatabase } = await import("@/lib/scripts/seed");
          await seedDatabase();
          toast({ title: "Success", description: "Basic mock data added." });
      } else {
          const functions = getFunctions(); 
          functions.customDomain = FUNCTIONS_BASE_URL; 
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
          functions.customDomain = FUNCTIONS_BASE_URL;
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
            <p className="text-muted-foreground">Manage your account, preferences, and platform configurations.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            
            {/* 1. General Preferences & Navigation Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Preferences & Navigation
                    </CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                             <h4 className="text-sm font-medium">Appearance</h4>
                             <p className="text-xs text-muted-foreground">Toggle between Light and Dark mode.</p>
                         </div>
                         <ThemeToggle />
                     </div>
                     <Separator />
                     
                     <div className="grid gap-2">
                         <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/settings/availability')}>
                             <Calendar className="mr-2 h-4 w-4" />
                             Scheduling Availability
                         </Button>
                         <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/settings/alerts')}>
                             <Bell className="mr-2 h-4 w-4" />
                             Notification Alerts
                         </Button>
                         <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/settings/integrations')}>
                             <Globe className="mr-2 h-4 w-4" />
                             Integrations
                         </Button>
                         <Button variant="outline" className="justify-start opacity-50 cursor-not-allowed">
                             <Lock className="mr-2 h-4 w-4" />
                             Security & Password (Coming Soon)
                         </Button>
                     </div>
                </CardContent>
            </Card>

            {/* 2. Developer Tools */}
            <Card className="border-l-4 border-l-blue-500 bg-slate-50 dark:bg-slate-950">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Developer Tools
                    </CardTitle>
                    <CardDescription>
                    Utilities for populating the platform with test data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleSeed('basic')} disabled={isSeeding || isAiSeeding || isClearing} variant="outline" className="w-full">
                            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Basic Data
                        </Button>
                        
                        <Button onClick={() => handleSeed('ai')} disabled={isSeeding || isAiSeeding || isClearing} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
                            {isAiSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            AI Scenarios
                        </Button>
                    </div>

                    <Separator />
                    
                    <Button onClick={handleClear} disabled={isSeeding || isAiSeeding || isClearing} variant="destructive" className="w-full">
                        {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Clear All Demo Data
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
