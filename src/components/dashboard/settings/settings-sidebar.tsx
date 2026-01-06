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
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  User,
  Bell,
  Lock,
  Globe,
  Database,
  CreditCard,
  CloudCog,
  Shield,
  Calendar,
  Settings
} from "lucide-react";

export function SettingsSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="w-64 border-r h-full bg-muted/10 hidden md:block">
      <div className="p-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <Settings className="h-5 w-5"/> Settings
        </h3>
      </div>
      <div className="px-4 pb-4">
        <div className="space-y-1">
            <ButtonLink href="/dashboard/settings/profile" icon={User} label="Profile" active={isActive("/dashboard/settings/profile")} />
            <ButtonLink href="/dashboard/settings/notifications" icon={Bell} label="Notifications" active={isActive("/dashboard/settings/notifications")} />
            <ButtonLink href="/dashboard/settings/availability" icon={Calendar} label="Availability" active={isActive("/dashboard/settings/availability")} />
            <ButtonLink href="/dashboard/settings/security" icon={Shield} label="Security" active={isActive("/dashboard/settings/security")} />
            <ButtonLink href="/dashboard/settings/account" icon={Database} label="Account Data" active={isActive("/dashboard/settings/account")} />
        </div>

        <div className="mt-8">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Organization</h4>
            <div className="space-y-1">
                <ButtonLink href="/dashboard/settings/billing" icon={CreditCard} label="Billing & Plans" active={isActive("/dashboard/settings/billing")} />
                <ButtonLink href="/dashboard/settings/integrations" icon={CloudCog} label="Integrations" active={isActive("/dashboard/settings/integrations")} />
                <ButtonLink href="/dashboard/settings/localization" icon={Globe} label="Localization" active={isActive("/dashboard/settings/localization")} />
            </div>
        </div>
      </div>
    </div>
  );
}

function ButtonLink({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
    return (
        <Link href={href}>
            <button className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon className="h-4 w-4" />
                {label}
            </button>
        </Link>
    );
}
