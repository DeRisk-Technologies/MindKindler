"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");

  const [config, setConfig] = useState({
      baseUrl: "",
      clientId: "",
      clientSecret: "",
      syncGrades: true,
      syncRoster: true,
      syncAttendance: false
  });

  const handleSave = async () => {
      setLoading(true);
      try {
          // In a real app, secrets should be encrypted or sent to a secure backend endpoint
          // For prototype, saving to firestore 'integrations' collection
          await addDoc(collection(db, "integrations"), {
              type: activeTab,
              status: "active",
              credentials: {
                  baseUrl: config.baseUrl,
                  clientId: config.clientId,
                  // clientSecret: "ENCRYPTED" 
              },
              settings: {
                  syncGrades: config.syncGrades,
                  syncRoster: config.syncRoster,
                  syncAttendance: config.syncAttendance
              },
              createdAt: serverTimestamp()
          });
          
          toast({ title: "Integration Saved", description: `${activeTab} connection active.` });
      } catch (e) {
          toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
      } finally {
          setLoading(false);
      }
  };

  const handleSyncNow = () => {
      toast({ title: "Sync Started", description: "Fetching data from external system..." });
      // Trigger Cloud Function here
  };

  return (
    <div className="space-y-8 p-8 pt-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Integrations</h1>
            <p className="text-muted-foreground">Connect external LMS and SIS platforms.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            {/* Sidebar / Selection */}
            <div className="space-y-4">
                {['Canvas', 'Blackboard', 'Google Classroom', 'PowerSchool'].map((sys) => (
                    <Card 
                        key={sys} 
                        className={`cursor-pointer transition-all hover:border-primary ${activeTab === sys.toLowerCase() ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => setActiveTab(sys.toLowerCase())}
                    >
                        <CardHeader className="p-4 flex flex-row items-center gap-4">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold text-lg">
                                {sys.charAt(0)}
                            </div>
                            <div>
                                <CardTitle className="text-base">{sys}</CardTitle>
                                <CardDescription className="text-xs">LMS / SIS Provider</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Config Form */}
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle className="capitalize">{activeTab} Configuration</CardTitle>
                                <CardDescription>Configure API access and data sync rules.</CardDescription>
                            </div>
                            <Badge variant="outline" className="h-fit">Not Connected</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Base URL</Label>
                            <Input 
                                placeholder={`https://${activeTab}.instructure.com`} 
                                value={config.baseUrl}
                                onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Client ID</Label>
                                <Input 
                                    value={config.clientId}
                                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Client Secret / API Key</Label>
                                <Input 
                                    type="password" 
                                    value={config.clientSecret}
                                    onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium text-sm">Sync Preferences</h4>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Sync Roster</Label>
                                    <p className="text-xs text-muted-foreground">Import students and teachers</p>
                                </div>
                                <Switch 
                                    checked={config.syncRoster}
                                    onCheckedChange={(c) => setConfig({...config, syncRoster: c})}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Sync Grades</Label>
                                    <p className="text-xs text-muted-foreground">Import assignment scores</p>
                                </div>
                                <Switch 
                                    checked={config.syncGrades}
                                    onCheckedChange={(c) => setConfig({...config, syncGrades: c})}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Sync Attendance</Label>
                                    <p className="text-xs text-muted-foreground">Import daily attendance logs</p>
                                </div>
                                <Switch 
                                    checked={config.syncAttendance}
                                    onCheckedChange={(c) => setConfig({...config, syncAttendance: c})}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6">
                        <Button variant="outline" onClick={handleSyncNow}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Sync Now
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
