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
  FileCheck,
  Search,
  Building,
  Plug,
  UserCircle,
  Palette,
  Map as MapIcon,
  Activity,
  BarChart3,
  LineChart
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

  // Specific Role Checks for Layout
  const isSuperAdmin = hasRole(['SuperAdmin']);
  const isClinician = hasRole(['EPP', 'TenantAdmin', 'SuperAdmin']);
  const isAssistant = hasRole(['Assistant', 'TrustedAssistant']);
  const isPracticeOwner = can('manage_client_schools'); // EPPs & Tenant Admins

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        
        {/* 1. CLINICAL WORKSPACE */}
        <SidebarGroup>
          <SidebarGroupLabel>Clinical Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Overview">
                <Link href="/dashboard"><LayoutDashboard /><span>Overview</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* SAFEGUARDING SHORTCUT (High Visibility) */}
            {isClinician && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/intelligence/safeguarding")} tooltip="Safeguarding">
                    <Link href="/dashboard/intelligence/safeguarding" className="text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border-l-2 border-red-500">
                        <ShieldAlert /><span>Safeguarding</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            
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
                        {/* Parent Portal Link */}
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/students/parents")}>
                            <Link href="/dashboard/students?tab=parents"><span>Parents & Guardians</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive("/dashboard/consultations")}>
                                <Link href="/dashboard/consultations"><span>Consultations</span></Link>
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
                           <Eye className="text-emerald-600" /><span>Observation Mode (mobile)</span>
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
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/assessments")}>
                            <Link href="/dashboard/assessments"><span>Library</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/reports")}>
                            <Link href="/dashboard/reports"><span>Reports Directory</span></Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
                </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* 2. PRACTICE MANAGEMENT */}
        {isPracticeOwner && (
            <SidebarGroup>
                <SidebarGroupLabel>My Practice</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/enterprise/analytics")} tooltip="District Command">
                            <Link href="/dashboard/enterprise/analytics">
                                <LineChart className="text-blue-600" /><span>Command Center</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/schools")} tooltip="My Clients">
                            <Link href="/dashboard/schools">
                                <Building className="text-indigo-600" /><span>Client Schools</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/practice/team")} tooltip="My Team">
                            <Link href="/dashboard/practice/team">
                                <Briefcase className="text-indigo-600" /><span>Practice Team</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/schools?tab=map")} tooltip="Coverage Map">
                            <Link href="/dashboard/schools?tab=map">
                                <MapIcon className="text-indigo-600" /><span>Coverage Map</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/practice/verifications")} tooltip="Verifications">
                            <Link href="/dashboard/practice/verifications">
                                <CheckCircle2 className="text-indigo-600" /><span>Verification Queue</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/integrations")} tooltip="Integrations">
                            <Link href="/dashboard/settings/integrations">
                                <Plug className="text-indigo-600" /><span>Integrations</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 3. STATUTORY & COMPLIANCE */}
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

        {/* 4. COMMUNICATION & SCHEDULING */}
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

               <SidebarMenuItem>
                   <SidebarMenuButton asChild isActive={isActive("/dashboard/govintel/copilot")} tooltip="AI Co-Pilot">
                       <Link href="/dashboard/govintel/copilot">
                           <Sparkles className="text-purple-600" /><span>AI Co-Pilot</span>
                       </Link>
                   </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
        
        {/* 5. DATA OPERATIONS */}
        {(can('manage_data_ingestion') || isAssistant) && (
            <SidebarGroup>
                <SidebarGroupLabel>Data Operations</SidebarGroupLabel>
                <SidebarMenu>
                    <Collapsible defaultOpen={isActive("/dashboard/data-ingestion")} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Assistant Portal">
                                    <Upload /><span>Assistant Portal</span>
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/data-ingestion/import")}>
                                            <Link href="/dashboard/data-ingestion/import"><span>Import & Scan</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/data-ingestion/staging")}>
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

        {/* 6. COMMUNITY & INTELLIGENCE */}
        {(can('access_community') || can('view_gov_intel')) && (
            <SidebarGroup>
                <SidebarGroupLabel>Community & Knowledge</SidebarGroupLabel>
                <SidebarMenu>
                    {can('access_community') && (
                        <Collapsible defaultOpen={isActive("/dashboard/community")} className="group/collapsible">
                          <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                  <SidebarMenuButton tooltip="Community">
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
                                              <Link href="/dashboard/community/wiki"><span>Wiki</span></Link>
                                          </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                  </SidebarMenuSub>
                              </CollapsibleContent>
                          </SidebarMenuItem>
                      </Collapsible>
                    )}

                    {can('view_gov_intel') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/dashboard/intelligence")} tooltip="Knowledge Vault">
                                <Link href="/dashboard/intelligence"><Database /><span>Knowledge Vault</span></Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/training/my-learning")} tooltip="Academy">
                            <Link href="/dashboard/training/my-learning"><GraduationCap /><span>Training Academy</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 7. MARKETPLACE & GROWTH */}
        {can('access_marketplace') && (
            <SidebarGroup>
                <SidebarGroupLabel>Growth</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/marketplace")} tooltip="Marketplace">
                            <Link href="/dashboard/marketplace"><Store /><span>Marketplace</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/partner-portal")} tooltip="Partners">
                            <Link href="/dashboard/partner-portal/revenue"><Briefcase /><span>Partner Portal</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )}

        {/* 8. SYSTEM & ADMIN */}
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
                                     <SidebarMenuSubButton asChild isActive={isActive("/dashboard/settings/branding")}>
                                         <Link href="/dashboard/settings/branding"><Palette className="h-4 w-4 mr-2"/><span>Branding</span></Link>
                                     </SidebarMenuSubButton>
                                 </SidebarMenuSubItem>
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
                                 <SidebarMenuSubItem>
                                     <SidebarMenuSubButton asChild isActive={isActive("/dashboard/settings/account")}>
                                         <Link href="/dashboard/settings/account"><UserCircle className="h-4 w-4 mr-2"/><span>Account</span></Link>
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
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/pilot-metrics")}>
                                            <Link href="/dashboard/admin/pilot-metrics"><BarChart3 className="h-4 w-4 mr-2"/><span>Pilot Telemetry</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isActive("/dashboard/admin/diagnostics")}>
                                            <Link href="/dashboard/admin/diagnostics"><Activity className="h-4 w-4 mr-2"/><span>System Diagnostics</span></Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
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
