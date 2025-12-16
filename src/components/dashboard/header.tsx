import { Bell, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SidebarTrigger } from "../ui/sidebar";
import { UserNav } from "./user-nav";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cases, students..."
            className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
      </div>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Toggle notifications</span>
      </Button>
      <UserNav />
    </header>
  );
}
