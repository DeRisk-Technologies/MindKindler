import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar>
          <DashboardSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <DashboardHeader />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
