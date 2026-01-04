"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Logo } from "../logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Stethoscope,
  Store,
  GraduationCap,
  Globe,
  Briefcase,
  FilePlus,
  Upload,
  Users,
  MessageSquare,
  Sparkles,
  Calendar,
  Database,
  Building2,
  Network,
  List,
  User,
  FileText,
  ClipboardList,
  BookUser
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isTrustedAssistant, setIsTrustedAssistant] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setRole(data.role);
            setIsTrustedAssistant(data.isTrustedAssistant === true);
          }
        } catch (e) {
          console.error("Error fetching role", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // --- Role Definitions ---
  
  // Super User
  const isSuperAdmin = role === 'SuperAdmin';
  
  // Administrators (Organization Level)
  // Independent EPPs act as their own TenantAdmin
  const isTenantAdmin = role === 'TenantAdmin' || role === 'SchoolAdmin' || isSuperAdmin;
  
  // Clinical Practitioners (EPPs, Psychologists)
  // Note: Independent EPPs usually hold this role AND TenantAdmin, or just EPP if managed.
  const isClinician = role === 'EPP' || role === 'SchoolPsychologist' || role === 'ClinicalPsychologist' || isTenantAdmin;
  
  // Support Staff
  const isAssistant = role === 'Assistant' || role === 'TrustedAssistant' || isTenantAdmin;
  
  // Government / Policy
  const isGov = role === 'GovAnalyst' || role === 'StateOfficial' || isSuperAdmin;

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        
        {/* =========================================
            1. CORE CLINICAL WORKSPACE
            (Visible to EPPs, School Admins, Tenant Admins)
           ========================================= */}
        <SidebarGroup>
          <SidebarGroupLabel>Clinical Workspace</SidebarGroupLabel>
          <SidebarMenu>
            
            {/* Dashboard Overview */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Overview">
                <Link href="/dashboard"><LayoutDashboard /><span>Overview</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* Caseload Management - PRIMARY ANCHOR */}
            {isClinician && (
                <Collapsible defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Caseload">
                        <BookUser /><span>My Caseload</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/students")}>
                            <Link href="/dashboard/students"><span>Students Directory</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/cases")}>
                            <Link href="/dashboard/cases"><span>Active Cases</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {/* Added Parents link for completeness */}
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/students/parents")}>
                            <Link href="/dashboard/students"><span>Parents & Guardians</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
                </Collapsible>
            )}

            {/* Assessment & Reporting */}
            {isClinician && (
                <Collapsible defaultOpen={isActive("/dashboard/assessments") || isActive("/dashboard/reports")} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Assessments & Reports">
                        <ClipboardList /><span>Assessments & Reports</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/assessments")}>
                            <Link href="/dashboard/assessments"><span>Assessments Library</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/reports") && !pathname.includes('builder')}>
                            <Link href="/dashboard/reports"><span>Reports Archive</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/reports/builder")}>
                            <Link href="/dashboard/reports/builder"><FilePlus className="mr-2 h-4 w-4"/><span>Report Writer</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
                </Collapsible>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/consultations")} tooltip="Consultations">
                <Link href="/dashboard/consultations"><Stethoscope /><span>Consultations</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* =========================================
            2. COMMUNICATION & SCHEDULING
           ========================================= */}
        <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarMenu>
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/messages")} tooltip="Secure Chat">
                       <Link href="/dashboard/messages">
                           <MessageSquare className="text-blue-500" /><span>Messages</span>
                       </Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
               
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/appointments")} tooltip="Calendar">
                       <Link href="/dashboard/appointments/calendar">
                           <Calendar className="text-green-600" /><span>Calendar & Booking</span>
                       </Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>

               {/* AI Co-Pilot (Clinicians Only) */}
               {isClinician && (
                   <SidebarMenuItem>
                       <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/copilot")} tooltip="AI Co-Pilot">
                           <Link href="/dashboard/govintel/copilot">
                               <Sparkles className="text-purple-600" /><span>AI Co-Pilot</span>
                           </Link>
                       </SidebarMenuButton>
                   </SidebarMenuItem>
               )}
            </SidebarMenu>
        </SidebarGroup>

        {/* =========================================
            3. ENTERPRISE & GOVINTEL 
            (Gov, State, SuperAdmin, Large LEA Admins)
           ========================================= */}
        {(isGov || isTenantAdmin) && (
            <SidebarGroup>
                <SidebarGroupLabel>Organization & Strategy</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/hierarchy")} tooltip="Org Hierarchy">
                            <Link href="/dashboard/govintel/hierarchy">
                                <Network className="text-orange-500"/><span>Organization Graph</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Collapsible defaultOpen={isActive("/dashboard/govintel")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Government Intelligence">
                                    <Globe /><span>Intelligence & Policy</span>
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/govintel/overview")}>
                                            <Link href="/dashboard/govintel/overview"><span>Overview</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/govintel/benchmarking")}>
                                            <Link href="/dashboard/govintel/benchmarking"><span>Benchmarking</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/govintel/planner")}>
                                            <Link href="/dashboard/govintel/planner"><span>Policy Planner</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* =========================================
            4. DATA OPERATIONS
            (Admins, Assistants - and Independent EPPs for Import)
           ========================================= */}
        {(isTenantAdmin || isAssistant) && (
            <SidebarGroup>
                <SidebarGroupLabel>Data Operations</SidebarGroupLabel>
                <SidebarMenu>
                    <Collapsible defaultOpen={isActive("/dashboard/data-ingestion")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Upload Portal">
                                    <Upload /><span>Assistant Portal</span>
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/data-ingestion/import"}>
                                            <Link href="/dashboard/data-ingestion/import"><span>Import & Scan</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={pathname.includes("/staging")}>
                                            <Link href="/dashboard/data-ingestion/staging"><span>Review Queue</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* =========================================
            5. COMMUNITY & GROWTH (All Users)
           ========================================= */}
        <SidebarGroup>
            <SidebarGroupLabel>Community & Growth</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible defaultOpen={isActive("/dashboard/community")} className="group/collapsible">
                  <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip="MindKindler Community">
                              <Users /><span>Community</span>
                              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                          <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={isActive("/dashboard/community/forum")}>
                                      <Link href="/dashboard/community/forum"><span>Forum</span></Link>
                                  </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={isActive("/dashboard/community/wiki")}>
                                      <Link href="/dashboard/community/wiki"><span>Wiki & Knowledge</span></Link>
                                  </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={isActive("/dashboard/community/blog")}>
                                      <Link href="/dashboard/community/blog"><span>Blog & News</span></Link>
                                  </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                          </SidebarMenuSub>
                      </CollapsibleContent>
                  </SidebarMenuItem>
              </Collapsible>

               <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/dashboard/intelligence")} tooltip="Global Knowledge Vault">
                    <Link href="/dashboard/intelligence"><Database /><span>Knowledge Vault</span></Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/training/library")} tooltip="Academy">
                        <Link href="/dashboard/training/library"><GraduationCap /><span>Training Academy</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/marketplace")} tooltip="Marketplace">
                        <Link href="/dashboard/marketplace"><Store /><span>Resource Market</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/partner-portal")} tooltip="Partner Portal">
                        <Link href="/dashboard/partner-portal/revenue"><Briefcase /><span>Partner Portal</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>

        {/* =========================================
            6. SYSTEM & ADMIN
           ========================================= */}
        <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Settings">
                        <Link href="/dashboard/settings"><Settings /><span>Settings</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* SuperAdmin / Owner Tools */}
                {isSuperAdmin && (
                    <Collapsible defaultOpen={isActive("/dashboard/admin")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="MindKindler Admin Console" className="text-red-600 hover:text-red-700">
                                    <ShieldAlert /><span>Owner Console</span>
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/tenants")}>
                                            <Link href="/dashboard/admin/tenants"><List className="h-4 w-4 mr-2"/><span>All Tenants</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/enterprise/new")}>
                                            <Link href="/dashboard/admin/enterprise/new"><Building2 className="h-4 w-4 mr-2"/><span>Provision Tenant</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/users")}>
                                            <Link href="/dashboard/admin/users"><Users className="h-4 w-4 mr-2"/><span>Global Users</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/settings/localization")}>
                                            <Link href="/dashboard/settings/localization"><Globe className="h-4 w-4 mr-2"/><span>Localization</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
            </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
    </>
  );
}
