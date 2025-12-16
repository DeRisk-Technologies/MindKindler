"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Logo } from "../logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  BookUser,
  Calendar,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/dashboard/students", icon: <BookUser />, label: "Students" },
  { href: "/dashboard/cases", icon: <FolderKanban />, label: "Cases" },
  {
    href: "/dashboard/assessments",
    icon: <ClipboardList />,
    label: "Assessments",
  },
  { href: "/dashboard/reports", icon: <BarChart />, label: "Reports" },
  { href: "/dashboard/appointments", icon: <Calendar />, label: "Appointments" },
  { href: "/dashboard/analytics", icon: <PieChart />, label: "Analytics" },
  { href: "/dashboard/messages", icon: <MessageSquare />, label: "Messages" },
  { href: "/dashboard/settings", icon: <Settings />, label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
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
      </SidebarContent>
    </>
  );
}
