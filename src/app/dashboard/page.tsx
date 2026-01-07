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
  CreditCard,
  Wrench,
  Trash2,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { auth, db, functions } from "@/lib/firebase"; // Import functions
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePermissions } from "@/hooks/use-permissions"; 
import { ComplianceWidget } from "@/components/dashboard/widgets/ComplianceWidget"; 
import { MyCaseload } from "@/components/dashboard/widgets/MyCaseload"; 
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions"; 

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Professional");
  const [isOnline, setIsOnline] = useState(true);
  const { can, hasRole, user, role: resolvedRole } = usePermissions(); 
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

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

  const isSuperAdmin = hasRole(['SuperAdmin']);
  const isGov = hasRole(['GovAnalyst', 'SuperAdmin']);
  
  const showClinical = can('view_psychometrics') || can('view_sensitive_notes');
  const showCompliance = can('view_staff_scr') || can('manage_compliance_packs');

  // Dev Tool: Self-Promote to Admin (Enhanced for Sharding)
  const handleFixRole = async () => {
      if (!user) return;
      try {
          // Force update to GLOBAL DB (Routing)
          await setDoc(doc(db, 'user_routing', user.uid), {
              uid: user.uid,
              role: 'SuperAdmin',
              email: user.email,
              region: 'uk', // Force UK Context for repair
              shardId: 'mindkindler-uk'
          }, { merge: true });

          // Force update to LOCAL User Record (if accessible)
          await setDoc(doc(db, 'users', user.uid), {
              role: 'SuperAdmin',
              firstName: 'Fixed',
              lastName: 'Admin',
              verification: { status: 'verified' }
          }, { merge: true });
          
          toast({ title: "Role Fixed", description: "Global routing updated to SuperAdmin/UK. Refreshing..." });
          
          // Force Token Refresh to clear stale claims
          await user.getIdToken(true);
          window.location.reload();
      } catch (e: any) {
          toast({ variant: "destructive", title: "Update Failed", description: e.message });
      }
  };

  const runSeed = async (action: string, region: string = 'uk') => {
      if (!confirm(`Run Pilot Action: ${action} (${region})?`)) return;
      setIsSeeding(true);
      try {
          const seedFn = httpsCallable(functions, 'seedDemoData');
          const res = await seedFn({ action, region, count: 5 });
          toast({ title: "Action Complete", description: (res.data as any).message });
      } catch (e: any) {
          toast({ variant: "destructive", title: "Failed", description: e.message });
      } finally {
          setIsSeeding(false);
      }
  };

  const runClear = async () => {
      if (!confirm("WARNING: This will wipe all pilot data marked as 'isSeed'. Continue?")) return;
      setIsSeeding(true);
      try {
          const clearFn = httpsCallable(functions, 'clearDemoData');
          const res = await clearFn({ region: 'uk', tenantId: 'default' });
          toast({ title: "Cleanup Complete", description: (res.data as any).message });
      } catch (e: any) {
          toast({ variant: "destructive", title: "Failed", description: e.message });
      } finally {
          setIsSeeding(false);
      }
  };

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
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
             <span>Resolved Role: {resolvedRole || "None"}</span>
             {/* Show Fix button if Role is None OR email contains 'admin' (even if role is Parent) */}
             {(!resolvedRole || user?.email?.includes('admin')) && (
                 <Button variant="link" size="sm" className="text-orange-600 h-auto p-0 font-bold" onClick={handleFixRole}>
                    <Wrench className="h-3 w-3 mr-1" /> Force SuperAdmin (Dev)
                 </Button>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showClinical && (
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

      {/* === SUPER ADMIN PILOT TOOLS === */}
      {isSuperAdmin && (
          <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-l-4 border-l-cyan-600 md:col-span-3 bg-cyan-50/30">
                  <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-cyan-700" />
                          Pilot Management Console
                      </CardTitle>
                      <CardDescription>Tools for managing the UK/US Pilot rollout.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                      <Button variant="outline" onClick={() => runSeed('create_regional_admins')} disabled={isSeeding}>
                          <Users className="mr-2 h-4 w-4" /> Create Regional Admins
                      </Button>
                      <Button variant="outline" onClick={() => runSeed('seed_students', 'uk')} disabled={isSeeding}>
                          <Database className="mr-2 h-4 w-4" /> Seed UK Data (5 Students)
                      </Button>
                       <Button variant="outline" onClick={() => runSeed('seed_students', 'us')} disabled={isSeeding}>
                          <Database className="mr-2 h-4 w-4" /> Seed US Data (5 Students)
                      </Button>
                      <Button variant="destructive" onClick={runClear} disabled={isSeeding}>
                          <Trash2 className="mr-2 h-4 w-4" /> Wipe Pilot Data (UK)
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* ... (Rest of Dashboard Content) ... */}
      
      {/* Role Specific Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {showClinical && (
              <div className="lg:col-span-2 h-[250px]">
                  <MyCaseload />
              </div>
          )}

          {showCompliance && (
              <div className="h-[250px]">
                  <ComplianceWidget />
              </div>
          )}
      </div>
      
    </div>
  );
}
