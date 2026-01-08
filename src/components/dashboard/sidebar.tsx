// src/components/dashboard/sidebar.tsx

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
  Store,
  GraduationCap,
  Globe,
  Briefcase,
  FilePlus,
  Users,
  MessageSquare,
  Calendar,
  Building2,
  Network,
  List,
  ClipboardList,
  BookUser,
  Eye,
  CheckCircle2,
  FileCheck,
  BrainCircuit,
  PieChart,
  Import,
  PlusCircle,
  Video,
  Stethoscope,
  Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { can, hasRole } = usePermissions(); 
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdTokenResult();
        if (token.claims.role) setRole((token.claims.role as string).toLowerCase());
      }
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const isClinician = hasRole(['EPP', 'TenantAdmin', 'SuperAdmin', 'Assistant', 'TrustedAssistant']);
  const isGlobalSuperAdmin = hasRole(['SuperAdmin']);
  const isPracticeOwner = hasRole(['TenantAdmin', 'EPP']); 

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        
        {/* 1. CLINICAL OPERATIONS (Core Workflow) */}
        <SidebarGroup>
          <SidebarGroupLabel>Clinical Operations</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Overview">
                <Link href="/dashboard"><LayoutDashboard /><span>Overview</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
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
                    </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
                </Collapsible>
            )}

            {/* AI CONSULTATION ROOM (NEW INTEGRATION) */}
            {can('access_consultations') && (
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/consultations")} tooltip="Consultation Room">
                       <Link href="/dashboard/consultations">
                           <Stethoscope className="text-pink-600" /><span>Consultation Room</span>
                       </Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
            )}

            {can('view_psychometrics') && (
               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/assessments/mobile")} tooltip="Observation Mode">
                       <Link href="/dashboard/assessments/mobile">
                           <Eye className="text-emerald-600" /><span>Observation Mode (iPad)</span>
                       </Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
            )}

            {isClinician && (
                <Collapsible defaultOpen={isActive("/dashboard/assessments")} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Assessments & Reports">
                        <ClipboardList /><span>Assessments & Reports</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                    <SidebarMenuSub>
                        
                        {/* Standard Library */}
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive("/dashboard/assessments/library")}>
                                <Link href="/dashboard/assessments/library"><span>Assessment Library</span></Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* AI Creator (NEW) */}
                        {can('create_assessments') && (
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={isActive("/dashboard/assessments/builder")}>
                                    <Link href="/dashboard/assessments/builder" className="text-purple-600">
                                        <Sparkles className="h-3 w-3 mr-2"/><span>AI Assessment Creator</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        )}

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
          </SidebarMenu>
        </SidebarGroup>

        {/* 2. INTELLIGENCE & DATA */}
        {(can('view_gov_intel') || can('manage_data_ingestion')) && (
            <SidebarGroup>
                <SidebarGroupLabel>Intelligence & Data</SidebarGroupLabel>
                <SidebarMenu>
                    {can('view_gov_intel') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/overview")} tooltip="Benchmarks">
                                <Link href="/dashboard/govintel/overview">
                                    <BrainCircuit className="text-purple-600" /><span>GovIntel Benchmarks</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    {can('view_gov_intel') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/insights/outcomes")} tooltip="Analytics">
                                <Link href="/dashboard/insights/outcomes">
                                    <PieChart className="text-indigo-500" /><span>Outcome Analytics</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    {can('manage_data_ingestion') && (
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/data-ingestion/import")} tooltip="Import Data">
                                <Link href="/dashboard/data-ingestion/import">
                                    <Import className="text-orange-600" /><span>Data Import</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 3. PRACTICE MANAGEMENT (Partners, Assistants, Schools) */}
        {isPracticeOwner && (
            <SidebarGroup>
                <SidebarGroupLabel>Practice Management</SidebarGroupLabel>
                <SidebarMenu>
                    {/* Reorganized these into main list for better visibility for small practices */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/enterprise/new")} tooltip="Add School">
                            <Link href="/dashboard/admin/enterprise/new">
                                <PlusCircle className="text-blue-600" /><span>Add Client School</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/schools")} tooltip="My Client Schools">
                            <Link href="/dashboard/schools">
                                <Building2 className="text-slate-600" /><span>Client Schools</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/staff")} tooltip="Team & Assistants">
                            <Link href="/dashboard/staff">
                                <Users className="text-slate-600" /><span>My Team</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 4. PROFESSIONAL GROWTH */}
        {(can('access_community') || can('access_marketplace')) && (
            <SidebarGroup>
                <SidebarGroupLabel>Professional Growth</SidebarGroupLabel>
                <SidebarMenu>
                    {can('access_community') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/community")} tooltip="Community">
                                <Link href="/dashboard/community">
                                    <MessageSquare className="text-pink-500" /><span>Community Forum</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    {can('access_training') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/training/library")} tooltip="CPD Training">
                                <Link href="/dashboard/training/library">
                                    <GraduationCap className="text-blue-600" /><span>CPD Training</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    {can('access_marketplace') && (
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/marketplace")} tooltip="Marketplace">
                                <Link href="/dashboard/marketplace">
                                    <Store className="text-teal-600" /><span>Marketplace</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 5. COMMUNICATION */}
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
            </SidebarMenu>
        </SidebarGroup>

        {/* 6. SYSTEM & ADMIN (Bottom) */}
        <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarMenu>
                 <Collapsible defaultOpen={isActive("/dashboard/settings")} className="group/collapsible">
                     <SidebarMenuItem>
                         <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Settings">
                                <Settings /><span>Settings</span>
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                         </CollapsibleTrigger>
                         <CollapsibleContent>
                             <SidebarMenuSub>
                                 <SidebarMenuSubItem>
                                     <SidebarMenuSubButton asChild isActive={isActive("/dashboard/settings/compliance")}>
                                         <Link href="/dashboard/settings/compliance"><FileCheck className="h-4 w-4 mr-2"/><span>My Compliance</span></Link>
                                     </SidebarMenuSubButton>
                                 </SidebarMenuSubItem>
                                 <SidebarMenuSubItem>
                                     <SidebarMenuSubButton asChild isActive={isActive("/dashboard/settings/profile")}>
                                         <Link href="/dashboard/settings/profile"><span>Profile</span></Link>
                                     </SidebarMenuSubButton>
                                 </SidebarMenuSubItem>
                             </SidebarMenuSub>
                         </CollapsibleContent>
                     </SidebarMenuItem>
                 </Collapsible>
                
                {isGlobalSuperAdmin && (
                    <Collapsible defaultOpen={isActive("/dashboard/admin")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Global Admin" className="text-red-600 hover:text-red-700">
                                    <ShieldAlert /><span>Global Admin</span>
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
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/users")}>
                                            <Link href="/dashboard/admin/users"><Users className="h-4 w-4 mr-2"/><span>Global Users</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/verification")}>
                                            <Link href="/dashboard/admin/verification"><CheckCircle2 className="h-4 w-4 mr-2"/><span>Verification Queue</span></Link>
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
