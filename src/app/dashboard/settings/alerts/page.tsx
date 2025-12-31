"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, BellRing, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function AlertSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Mock state for thresholds (in real app, fetch from User Settings doc)
  const [thresholds, setThresholds] = useState({
    readingScoreDip: 15, // % drop
    attendanceDrop: 20, // % drop
    behavior_incidents: 3, // count
    aiConfidence: 85, // % confidence for auto-flagging
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        setIsSaving(false);
        toast({ title: "Settings Saved", description: "Alert thresholds updated." });
    }, 800);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">AI Alert Configuration</h1>
        <p className="text-muted-foreground">
          Define thresholds for when the AI should flag a student's progress or behavior.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-primary" />
                    Academic Alerts
                </CardTitle>
                <CardDescription>Triggers based on assessment scores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label>Significant Score Drop ({thresholds.readingScoreDip}%)</Label>
                    </div>
                    <Slider 
                        value={[thresholds.readingScoreDip]} 
                        max={50} step={1} 
                        onValueChange={(v) => setThresholds({...thresholds, readingScoreDip: v[0]})} 
                    />
                    <p className="text-xs text-muted-foreground">
                        Flag if a student's score drops by this percentage between assessments.
                    </p>
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="consistency">Flag Inconsistent Performance</Label>
                    <Switch id="consistency" defaultChecked />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-red-500" />
                    Behavioral & Attendance
                </CardTitle>
                <CardDescription>Triggers based on school reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label>Incident Threshold ({thresholds["behavior_incidents"]} / month)</Label>
                    </div>
                    <Slider 
                        value={[thresholds["behavior_incidents"]]} 
                        max={10} step={1} 
                        onValueChange={(v) => setThresholds({...thresholds, "behavior_incidents": v[0]})} 
                    />
                    <p className="text-xs text-muted-foreground">
                        Alert EPP if reported incidents exceed this number.
                    </p>
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="attendance">Monitor Attendance Drops</Label>
                    <Switch id="attendance" defaultChecked />
                </div>
            </CardContent>
        </Card>
      </div>

       <div className="flex justify-end">
         <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
         </Button>
       </div>
    </div>
  );
}
