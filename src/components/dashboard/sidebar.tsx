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
  BookUser,
  Eye,
  Shield,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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

  const isClinician = hasRole(['EPP', 'TenantAdmin', 'SuperAdmin']);
  const isSuperAdmin = hasRole(['SuperAdmin']);

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        
        {/* 1. CORE CLINICAL WORKSPACE */}
        <SidebarGroup>
          <SidebarGroupLabel>Clinical Workspace</SidebarGroupLabel>
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

        {/* 2. STATUTORY & COMPLIANCE (RBAC Protected) */}
        {can('view_staff_scr') && (
            <SidebarGroup>
                <SidebarGroupLabel>Statutory Compliance</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/staff")} tooltip="Single Central Record">
                            <Link href="/dashboard/staff">
                                <ShieldAlert className="text-amber-600" /><span>Staff Vetting (SCR)</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 3. COMMUNICATION & SCHEDULING */}
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

        {/* 4. MARKETPLACE & GROWTH */}
        {can('manage_compliance_packs') && (
            <SidebarGroup>
                <SidebarGroupLabel>Growth</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/marketplace")} tooltip="Marketplace">
                            <Link href="/dashboard/marketplace"><Store /><span>Marketplace</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 5. SYSTEM & ADMIN */}
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
                
                {isSuperAdmin && (
                    <Collapsible defaultOpen={isActive("/dashboard/admin")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Owner Console" className="text-red-600 hover:text-red-700">
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
