"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { StudentRecord } from "@/types/schema";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Loader2, Sparkles, Trash2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function OnboardingPilot() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Fetch students to determine state
    const { data: students, loading, refresh } = useFirestoreCollection<StudentRecord>("students");
    
    const [isProcessing, setIsProcessing] = useState(false);

    // Analyze State
    const studentCount = students.length;
    // Check if any student is marked as seed data
    const hasDemoData = students.some(s => (s as any).isSeed === true);
    
    // State C: Safety Hide (Production Limit)
    if (!loading && studentCount > 10 && !hasDemoData) {
        return null; 
    }

    // Actions
    const handleSeed = async () => {
        setIsProcessing(true);
        try {
            // Updated to use the unified provisioner
            const provisionFn = httpsCallable(functions, 'provisionTenantData');
            const result = await provisionFn({ action: 'seed_pilot_uk' });
            
            toast({ 
                title: "Success", 
                description: (result.data as any).message || "Pilot data loaded successfully." 
            });
            
            // Allow time for backend to write before refresh
            setTimeout(() => refresh(), 1000);
        } catch (e: any) {
            console.error(e);
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: e.message || "Failed to load data." 
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Are you sure? This will delete all demo data and reset your view.")) return;
        
        setIsProcessing(true);
        try {
            const provisionFn = httpsCallable(functions, 'provisionTenantData');
            await provisionFn({ action: 'clear_all', confirmation: true });
            
            toast({ title: "Cleared", description: "Demo data removed." });
            
            setTimeout(() => refresh(), 1000);
        } catch (e: any) {
            console.error(e);
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: e.message || "Failed to clear data." 
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading State
    if (loading) return null;

    // HIDE if: Active tenant with real data (count > 0 AND no demo data) - handled above via safety check, but cleaner here:
    if (studentCount > 0 && !hasDemoData) return null;

    return (
        <Card className="bg-indigo-50 border-indigo-100 shadow-sm mb-6">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg text-indigo-900">Welcome to MindKindler Pilot</CardTitle>
                </div>
                <CardDescription className="text-indigo-700">
                    {studentCount === 0 
                        ? "Your workspace is empty. Load our UK Pilot scenarios to explore the platform safely." 
                        : "You are currently running in Pilot Mode with sample data."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {studentCount === 0 ? (
                    <Button 
                        onClick={handleSeed} 
                        disabled={isProcessing} 
                        className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto transition-all"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Load UK Pilot Data (Charlie, Sammy, Riley)
                    </Button>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Alert className="bg-white border-indigo-200 flex-grow">
                            <AlertTitle className="text-sm font-semibold text-indigo-800">Demo Data Active</AlertTitle>
                            <AlertDescription className="text-xs text-indigo-600 mt-1">
                                {studentCount} students loaded. You can edit reports, run consultations, and test workflows safely.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            variant="outline" 
                            onClick={handleClear} 
                            disabled={isProcessing} 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto whitespace-nowrap"
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Reset / Clear Data
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
