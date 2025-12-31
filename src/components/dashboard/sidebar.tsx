"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Logo } from "../logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  BookUser,
  Calendar,
  ClipboardList,
  Database,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Link2,
  MessageSquare,
  PieChart,
  School,
  Settings,
  ShieldAlert,
  Siren,
  Stethoscope,
  Store,
  GraduationCap,
  Globe,
  Briefcase,
  Users,
  Handshake,
  FileText,
  Map,
  Languages,
  BookA,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
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
    return () => unsubscribe();
  }, []);

  // Helper to check active state
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        
        {/* === 1. Clinical & Case Management === */}
        <SidebarGroup>
          <SidebarGroupLabel>Clinical Workflow</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Overview">
                <Link href="/dashboard"><LayoutDashboard /><span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/students")} tooltip="Students">
                <Link href="/dashboard/students"><BookUser /><span>Students & Parents</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/cases")} tooltip="Cases">
                <Link href="/dashboard/cases"><FolderKanban /><span>Cases & IEPs</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/consultations")} tooltip="Consultations">
                <Link href="/dashboard/consultations"><Stethoscope /><span>Consultations</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/assessments")} tooltip="Assessments">
                <Link href="/dashboard/assessments"><ClipboardList /><span>Assessments</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton asChild isActive={isActive("/dashboard/appointments")} tooltip="Calendar">
                 <Link href="/dashboard/appointments"><Calendar /><span>Appointments</span></Link>
               </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* === 2. Government & Intelligence (Phase 4) === */}
        <SidebarGroup>
           <SidebarGroupLabel>Government & Intelligence</SidebarGroupLabel>
           <SidebarMenu>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/overview")} tooltip="GovIntel Overview">
                    <Link href="/dashboard/govintel/overview"><Globe /><span>Overview</span></Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/benchmarking")} tooltip="Benchmarking">
                    <Link href="/dashboard/govintel/benchmarking"><BarChart /><span>Benchmarking</span></Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/planner")} tooltip="Capacity Planner">
                    <Link href="/dashboard/govintel/planner"><PieChart /><span>Policy Planner</span></Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/intelligence")} tooltip="Knowledge Vault">
                    <Link href="/dashboard/intelligence"><Database /><span>Knowledge Vault</span></Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarGroup>

        {/* === 3. Training & Professional Development (Phase 3D) === */}
        <SidebarGroup>
            <SidebarGroupLabel>Training Academy</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/training/library")} tooltip="Course Library">
                        <Link href="/dashboard/training/library"><GraduationCap /><span>Course Library</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/training/certificates")} tooltip="Certificates">
                        <Link href="/dashboard/training/certificates"><FileText /><span>My Certificates</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 {role === 'admin' && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/training/admin")} tooltip="Training Admin">
                             <Link href="/dashboard/training/admin"><Settings /><span>Training Admin</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>

        {/* === 4. Marketplace & Partners (Phase 5) === */}
        <SidebarGroup>
            <SidebarGroupLabel>Ecosystem</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/marketplace")} tooltip="Marketplace">
                        <Link href="/dashboard/marketplace"><Store /><span>Marketplace</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/partners")} tooltip="Partners">
                        <Link href="/dashboard/partners"><Handshake /><span>Partner Network</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Specific link for active partners to manage their revenue */}
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/partner-portal")} tooltip="Partner Portal">
                        <Link href="/dashboard/partner-portal/revenue"><Briefcase /><span>Partner Portal</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>

        {/* === 5. Admin & Operations === */}
        <SidebarGroup>
           <SidebarGroupLabel>Operations</SidebarGroupLabel>
           <SidebarMenu>
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/schools")} tooltip="Districts">
                       <Link href="/dashboard/schools"><School /><span>Schools & Districts</span></Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/reports")} tooltip="Reports">
                   <Link href="/dashboard/reports"><BarChart /><span>Analytics & Reports</span></Link>
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/data-ingestion")} tooltip="Data Import">
                       <Link href="/dashboard/data-ingestion"><Database /><span>Data Ingestion</span></Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/integrations")} tooltip="Integrations">
                   <Link href="/dashboard/settings/integrations"><Link2 /><span>Integrations</span></Link>
                 </SidebarMenuButton>
               </SidebarMenuItem>
           </SidebarMenu>
        </SidebarGroup>

        {/* === 6. System Admin (Role Protected) === */}
        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-500">System Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/users")} tooltip="User Management">
                  <Link href="/dashboard/admin/users"><ShieldAlert className="text-red-500" /> <span className="text-red-500">User Management</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/partners/revenue")} tooltip="Revenue Ops">
                      <Link href="/dashboard/partners/revenue"><BarChart className="text-red-500"/> <span className="text-red-500">Revenue Ops</span></Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/localization")} tooltip="Localization">
                      <Link href="/dashboard/settings/localization"><Map className="text-red-500"/> <span className="text-red-500">Localization</span></Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/translations")} tooltip="Translations">
                      <Link href="/dashboard/settings/translations"><Languages className="text-red-500"/> <span className="text-red-500">Translations</span></Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              {/* New: Glossary Manager Link */}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/glossary")} tooltip="Glossary">
                      <Link href="/dashboard/settings/glossary"><BookA className="text-red-500"/> <span className="text-red-500">Glossary</span></Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Settings">
                        <Link href="/dashboard/settings"><Settings /><span>Global Settings</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
    </>
  );
}
