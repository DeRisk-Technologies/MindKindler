"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Brain,
  Calendar as CalendarIcon,
  ClipboardList,
  FileText,
  FolderKanban,
  Heart,
  Plus,
  Users,
  Wifi,
  WifiOff,
  Upload,
  Sparkles,
  Clock,
  Globe,
  Search,
  Building,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Professional");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setDisplayName(user.displayName || "User");
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

  const isSuperAdmin = role === 'SuperAdmin';
  const isTenantAdmin = role === 'TenantAdmin' || role === 'SchoolAdmin';
  const isClinician = ['educationalpsychologist', 'clinicalpsychologist', 'schoolpsychologist', 'EPP'].includes(role || '');
  const isAssistant = role === 'Assistant' || role === 'admin'; // Legacy mapping
  const isGov = ['localeducationauthority', 'ministry', 'federal', 'GovAnalyst'].includes(role || '');

  // Mock Appointments
  const appointments = [
      { id: '1', time: '10:00 AM', title: 'Initial Consultation - Leo M.', type: 'Video', link: '#' },
      { id: '2', time: '02:00 PM', title: 'School Visit - West High', type: 'In-Person', link: '#' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary/80" />
            MindKindler <span className="text-muted-foreground font-light text-xl">| CareOS</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {displayName}. {isOnline ? <span className="text-green-600 font-medium inline-flex items-center gap-1"><Wifi className="h-3 w-3"/> Online</span> : <span className="text-orange-600 font-medium inline-flex items-center gap-1"><WifiOff className="h-3 w-3"/> Offline Mode</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isClinician && (
             <Button size="lg" className="shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white gap-2" asChild>
                <Link href="/dashboard/cases">
                    <Plus className="h-5 w-5" /> New Case
                </Link>
             </Button>
          )}
          {(isSuperAdmin) && (
             <Button size="lg" variant="destructive" className="shadow-sm gap-2" asChild>
                <Link href="/dashboard/admin/enterprise/new">
                    <Building className="h-5 w-5" /> Provision Tenant
                </Link>
             </Button>
          )}
        </div>
      </div>

      <DashboardAlerts />

      {/* === 1. SuperAdmin / Owner View === */}
      {isSuperAdmin && (
          <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-l-4 border-l-red-600">
                  <CardHeader><CardTitle>Global Tenants</CardTitle></CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold">142</div>
                      <p className="text-xs text-muted-foreground">Active Organizations</p>
                      <Button variant="link" asChild className="px-0"><Link href="/dashboard/govintel/hierarchy">View Hierarchy &rarr;</Link></Button>
                  </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-600">
                  <CardHeader><CardTitle>Total MRR</CardTitle></CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold">$48.2k</div>
                      <p className="text-xs text-muted-foreground">+12% this month</p>
                      <Button variant="link" asChild className="px-0"><Link href="/dashboard/settings/billing">Billing Admin &rarr;</Link></Button>
                  </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-600">
                  <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-green-600">99.9%</div>
                      <p className="text-xs text-muted-foreground">All regions operational</p>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* === 2. Gov / State / LEA View === */}
      {isGov && (
          <div className="grid gap-6 md:grid-cols-3">
              <Card>
                  <CardHeader><CardTitle>District Overview</CardTitle></CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold">45</div>
                      <p className="text-xs text-muted-foreground">Schools Monitored</p>
                      <Button variant="link" asChild className="px-0"><Link href="/dashboard/govintel/hierarchy">Drill Down &rarr;</Link></Button>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>At-Risk Students</CardTitle></CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-red-600">120</div>
                      <p className="text-xs text-muted-foreground">Critical Interventions Needed</p>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* === 3. Clinician / EPP View === */}
      {(isClinician || isTenantAdmin) && !isSuperAdmin && (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                        <FolderKanban className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground mt-1">3 critical reviews due</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports Drafted</CardTitle>
                        <FileText className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready for AI Co-Pilot review</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outcomes</CardTitle>
                        <Heart className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700">84%</div>
                        <p className="text-xs text-muted-foreground mt-1">Positive trend</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Appt</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate">10:00 AM</div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Consultation (Video)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Workflow */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-indigo-50 hover:border-indigo-200" asChild>
                            <Link href="/dashboard/assessments">
                                <ClipboardList className="h-6 w-6 text-indigo-600" />
                                <span className="font-semibold text-xs">Start Assessment</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200" asChild>
                            <Link href="/dashboard/appointments/calendar">
                                <CalendarIcon className="h-6 w-6 text-emerald-600" />
                                <span className="font-semibold text-xs">View Calendar</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-pink-50 hover:border-pink-200" asChild>
                            <Link href="/dashboard/govintel/copilot">
                                <Sparkles className="h-6 w-6 text-pink-600" />
                                <span className="font-semibold text-xs">Ask AI Co-Pilot</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-blue-50 hover:border-blue-200" asChild>
                            <Link href="/dashboard/community/wiki">
                                <Search className="h-6 w-6 text-blue-600" />
                                <span className="font-semibold text-xs">Knowledge Base</span>
                            </Link>
                        </Button>
                    </div>

                    {/* Today's Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-gray-500" /> Today's Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {appointments.map(appt => (
                                    <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-16">
                                                <div className="font-bold text-sm text-gray-900">{appt.time.split(' ')[0]}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{appt.time.split(' ')[1]}</div>
                                            </div>
                                            <div className="border-l pl-4">
                                                <div className="font-medium text-sm">{appt.title}</div>
                                                <Badge variant="outline" className="text-[10px] mt-1">{appt.type}</Badge>
                                            </div>
                                        </div>
                                        <Button size="sm" variant={appt.type === 'Video' ? 'default' : 'outline'} asChild>
                                            <Link href={appt.link}>{appt.type === 'Video' ? 'Join Call' : 'Details'}</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Community Highlight */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-gray-500" /> Community Highlights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" role="button">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary">Hot Topic</Badge>
                                    <span className="text-xs text-muted-foreground">Forum</span>
                                </div>
                                <h4 className="font-medium text-sm mb-1">Adapting Assessment X for remote delivery</h4>
                                <p className="text-xs text-muted-foreground">12 new replies today</p>
                            </div>
                             <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" role="button">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="border-green-500 text-green-600">Vetted</Badge>
                                    <span className="text-xs text-muted-foreground">Wiki</span>
                                </div>
                                <h4 className="font-medium text-sm mb-1">Updated SEN Policy Template 2024</h4>
                                <p className="text-xs text-muted-foreground">Published by Ministry of Education</p>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: AI & Comms */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Sparkles className="h-5 w-5" /> AI Co-Pilot
                            </CardTitle>
                            <CardDescription className="text-indigo-100">
                                Your clinical assistant is ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white/10 p-3 rounded-lg text-sm backdrop-blur-sm">
                                <p className="font-medium mb-1">Recent Insight:</p>
                                <p className="opacity-90">"Student Leo M. shows 3 markers for Dyslexia in recent observation notes."</p>
                            </div>
                            <Button variant="secondary" className="w-full text-indigo-700 hover:text-indigo-800" asChild>
                                <Link href="/dashboard/govintel/copilot">Open Chat &rarr;</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Unread Messages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Avatar className="h-8 w-8"><AvatarFallback>SJ</AvatarFallback></Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-sm">Sarah Jenkins</span>
                                        <span className="text-[10px] text-muted-foreground">10m</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">Re: Update on Noah's IEP meeting...</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/messages">View Inbox</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
