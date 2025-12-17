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
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const mainNavItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/dashboard/students", icon: <BookUser />, label: "Students / Parents" },
  { href: "/dashboard/consultations", icon: <Stethoscope />, label: "Consultations" },
  { href: "/dashboard/cases", icon: <FolderKanban />, label: "Cases" },
  { href: "/dashboard/assessments", icon: <ClipboardList />, label: "Assessments" },
  { href: "/dashboard/reports", icon: <BarChart />, label: "Reports & Tools" },
  { href: "/dashboard/data-ingestion", icon: <Database />, label: "Data Import" }, 
  { href: "/dashboard/schools", icon: <School />, label: "Schools / Districts" },
  { href: "/dashboard/appointments", icon: <Calendar />, label: "Appointments" },
  { href: "/dashboard/messages", icon: <MessageSquare />, label: "Messages" },
];

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

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        {/* Main Navigation */}
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Analytics & Reports (Authorities) */}
        <SidebarGroup>
           <SidebarGroupLabel>Analytics & Insights</SidebarGroupLabel>
           <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/analytics"}
                  tooltip={{ children: "General Analytics" }}
                >
                  <Link href="/dashboard/analytics">
                    <PieChart />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/assessments/analytics"}
                  tooltip={{ children: "Assessment Analytics" }}
                >
                  <Link href="/dashboard/assessments/analytics">
                    <BarChart className="h-4 w-4" />
                    <span>Assessment Data</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/schools/analytics"}
                  tooltip={{ children: "District Analytics" }}
                >
                  <Link href="/dashboard/schools/analytics">
                    <School className="h-4 w-4" />
                    <span>District Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarGroup>

        {/* Admin Section */}
        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-500">Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/admin/users"}
                  tooltip={{ children: "User Management" }}
                >
                  <Link href="/dashboard/admin/users">
                    <ShieldAlert className="text-red-500" />
                    <span className="text-red-500 font-medium">User Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/admin/departments"}
                  tooltip={{ children: "Departments" }}
                >
                  <Link href="/dashboard/admin/departments">
                    <Layers className="text-red-500" />
                    <span className="text-red-500 font-medium">Departments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Settings & Configuration */}
        <SidebarGroup>
           <SidebarGroupLabel>Configuration</SidebarGroupLabel>
           <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings/integrations"}
                  tooltip={{ children: "LMS Integrations" }}
                >
                  <Link href="/dashboard/settings/integrations">
                    <Link2 />
                    <span>Integrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(role === 'admin' || role === 'educationalpsychologist') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/settings/alerts"}
                    tooltip={{ children: "AI Alerts" }}
                  >
                    <Link href="/dashboard/settings/alerts">
                      <Siren className="text-orange-500" />
                      <span className="text-orange-500 font-medium">Alert Config</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                  tooltip={{ children: "Settings" }}
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
    </>
  );
}
