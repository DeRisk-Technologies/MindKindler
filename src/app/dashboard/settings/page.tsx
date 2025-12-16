"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { seedDatabase } from "@/lib/scripts/seed";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  // ... (Existing Theme code)
  
  const handleSeed = async () => {
    if (!confirm("This will add mock data to your database. Continue?")) return;
    
    setIsSeeding(true);
    try {
      await seedDatabase();
      toast({
        title: "Success",
        description: "Mock data has been seeded to Firestore.",
      });
    } catch (e: any) {
       console.error(e);
       toast({
        title: "Error",
        description: "Failed to seed database: " + e.message,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // ... Return JSX
  return (
    <div className="space-y-8">
      {/* ... Existing Profile/Theme Cards ... */}
       <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>
              Utilities for testing and development.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={handleSeed} disabled={isSeeding} variant="outline">
               {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
               Generate Mock Data (Seed DB)
             </Button>
          </CardContent>
        </Card>
    </div>
  );
}
