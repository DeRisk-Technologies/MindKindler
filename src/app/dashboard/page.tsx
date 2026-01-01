"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Activity,
  Brain,
  Calendar as CalendarIcon,
  ClipboardList,
  FileText,
  FolderKanban,
  Heart,
  LineChart,
  MessageSquare,
  Plus,
  Search,
  Users,
  AlertTriangle,
  Stethoscope,
  ArrowRight,
  Wifi,
  WifiOff,
  Upload,
  FileCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Professional");
  const [isOnline, setIsOnline] = useState(true);

  // Detect online status for "Offline-Capable" feature visibility
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setDisplayName(user.displayName || "Professional");
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setRole(snap.data().role);
          }
        } catch (e) {
          console.error("Error fetching role", e);
        }
      }
    });
    return () => {
        unsubscribe();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Role Definitions
  const isClinician = ['educationalpsychologist', 'clinicalpsychologist', 'schoolpsychologist', 'admin'].includes(role || '');
  const isAssistant = role === 'assistant' || role === 'admin';
  const isGovernment = ['localeducationauthority', 'ministry', 'federal'].includes(role || '');

  // Mock Data for Clinical View
  const caseload = [
    { id: "C-204", name: "Leo Martinez", age: 8, issue: "Dyslexia Screening", status: "Assessment Phase", lastAction: "2 days ago" },
    { id: "C-208", name: "Amelia Williams", age: 12, issue: "Emotional Regulation", status: "Intervention", lastAction: "Yesterday" },
    { id: "C-211", name: "Noah Johnson", age: 6, issue: "Speech Delay", status: "Waiting List", lastAction: "1 week ago" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Bar: Identity & Status */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary/80" />
            MindKindler <span className="text-muted-foreground font-light text-xl">| CareOS</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Supporting child development. {isOnline ? <span className="text-green-600 font-medium inline-flex items-center gap-1"><Wifi className="h-3 w-3"/> Online</span> : <span className="text-orange-600 font-medium inline-flex items-center gap-1"><WifiOff className="h-3 w-3"/> Offline Mode Active</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isClinician && (
             <Button size="lg" className="shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <Link href="/dashboard/cases">
                    <Plus className="mr-2 h-5 w-5" /> Open New Case
                </Link>
             </Button>
          )}
          {isAssistant && (
             <Button size="lg" variant="secondary" className="shadow-sm" asChild>
                <Link href="/dashboard/data-ingestion">
                    <Upload className="mr-2 h-5 w-5" /> Upload Docs
                </Link>
             </Button>
          )}
        </div>
      </div>

      {/* 1. Safeguarding & Alerts (Top Priority) */}
      <DashboardAlerts />

      {/* 2. Clinical Core Metrics (The "Pulse" of the Practice) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric: Active Cases */}
        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Caseload</CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">3 requiring immediate review</p>
          </CardContent>
        </Card>

        {/* Metric: Child Impact (The "Why") */}
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outcome Progress</CardTitle>
            <Heart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">84%</div>
            <p className="text-xs text-muted-foreground mt-1">Students showing improvement</p>
          </CardContent>
        </Card>

        {/* Metric: Pending Reports / Uploads */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">
                {isAssistant ? "Docs in Staging" : "Reports ready for sign-off"}
            </p>
          </CardContent>
        </Card>

         {/* Metric: Upcoming Consultations */}
         <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground mt-1">2 School Visits, 1 Remote</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Workflow Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Caseload Management (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Rapid Access Clinical Tools */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-background hover:bg-accent hover:text-accent-foreground border-dashed border-2" asChild>
                    <Link href="/dashboard/assessments">
                        <ClipboardList className="h-6 w-6 text-indigo-600" />
                        <span className="font-semibold text-xs text-center">Start Assessment</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-background hover:bg-accent border-dashed border-2" asChild>
                    <Link href="/dashboard/consultations">
                        <Stethoscope className="h-6 w-6 text-emerald-600" />
                        <span className="font-semibold text-xs text-center">Log Observation</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-background hover:bg-accent border-dashed border-2" asChild>
                    <Link href="/dashboard/reports/builder">
                        <Brain className="h-6 w-6 text-pink-600" />
                        <span className="font-semibold text-xs text-center">AI Report Writer</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-background hover:bg-accent border-dashed border-2" asChild>
                    <Link href="/dashboard/students">
                        <Users className="h-6 w-6 text-blue-600" />
                        <span className="font-semibold text-xs text-center">Student Directory</span>
                    </Link>
                </Button>
            </div>

            {/* Active Caseload Table (or Staging Queue for Assistants) */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        {isAssistant ? "Recent Uploads" : "Recent Priority Cases"}
                    </CardTitle>
                    <CardDescription>
                        {isAssistant ? "Status of documents ingested today." : "Students requiring attention this week based on intervention tracking."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Simplified Switch for Role View */}
                    {!isAssistant ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Student</TableHead>
                                    <TableHead>Primary Concern</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {caseload.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.name.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-sm">{c.name}</div>
                                                    <div className="text-xs text-muted-foreground">Age {c.age}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{c.issue}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">{c.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/cases/${c.id}`}>Manage</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <p className="mb-4">No recent uploads found. Start scanning documents to see progress here.</p>
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/data-ingestion">Go to Upload Portal</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-2 flex justify-center">
                    <Button variant="link" size="sm" className="text-muted-foreground" asChild>
                        <Link href={isAssistant ? "/dashboard/data-ingestion" : "/dashboard/cases"}>
                            {isAssistant ? "View All Upload Jobs" : `View Full Caseload (${caseload.length + 9} more)`}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Gov Intelligence Teaser (if relevant role) */}
            {isGovernment && (
                <Card className="bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-blue-400" />
                            Regional Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-400">1,204</div>
                                <div className="text-xs text-slate-400">Assessments YTD</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-400">High</div>
                                <div className="text-xs text-slate-400">Intervention Success</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-400">12%</div>
                                <div className="text-xs text-slate-400">Need Capacity</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Right: AI Co-Pilot & Insights (1/3 width) */}
        <div className="space-y-6">
            
            {/* AI Co-Pilot Card */}
            <Card className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/40 dark:to-background border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Brain className="h-5 w-5" />
                        AI Clinical Co-Pilot
                    </CardTitle>
                    <CardDescription>
                        Automated insights from recent case notes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-white dark:bg-card p-3 rounded-lg border shadow-sm text-sm">
                        <div className="flex gap-2 items-start mb-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="font-semibold text-amber-700 dark:text-amber-500">Pattern Detected</span>
                        </div>
                        <p className="text-muted-foreground">
                            3 students in <span className="font-medium text-foreground">District 4</span> have reported similar anxiety markers related to "Exam Pressure" this week. Consider a group intervention?
                        </p>
                        <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-indigo-600">
                            Create Group Plan &rarr;
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-card p-3 rounded-lg border shadow-sm text-sm">
                         <div className="flex gap-2 items-start mb-1">
                            <FileText className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-500">Report Ready</span>
                        </div>
                        <p className="text-muted-foreground">
                            Draft assessment for <span className="font-medium text-foreground">Leo Martinez</span> is 90% complete. AI suggests 2 recommendations based on WISC-V scores.
                        </p>
                        <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-indigo-600" asChild>
                            <Link href="/dashboard/reports">Review Draft &rarr;</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Messages */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                        Recent Messages
                        <Badge variant="secondary" className="ml-2">2 New</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>SJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">Sarah Jenkins (Teacher)</div>
                            <div className="text-xs text-muted-foreground truncate">Re: Noah's behavior today...</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">10m</span>
                    </div>
                     <div className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>Dr</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">Dr. Ahmed (Clinical Lead)</div>
                            <div className="text-xs text-muted-foreground truncate">Case review meeting rescheduled.</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">2h</span>
                    </div>
                    <Button variant="outline" className="w-full text-xs" asChild>
                        <Link href="/dashboard/messages">Open Secure Inbox</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
