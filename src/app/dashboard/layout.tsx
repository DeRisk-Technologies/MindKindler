import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AIAssistantFloat } from "@/components/ai-assistant-float";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground relative">
        <Sidebar className="border-r">
          <DashboardSidebar />
        </Sidebar>
        <SidebarInset className="flex w-full flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
        <AIAssistantFloat />
      </div>
    </SidebarProvider>
  );
}
