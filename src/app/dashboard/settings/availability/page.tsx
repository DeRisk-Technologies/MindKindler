"use client";

import { AvailabilitySettings } from "@/components/dashboard/settings/availability-settings";

export default function AvailabilityPage() {
  return (
    <div className="space-y-6 p-8 pt-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Availability Settings</h1>
          <p className="text-muted-foreground">Manage your working hours and preferences for the scheduling AI.</p>
       </div>
       
       <AvailabilitySettings />
    </div>
  );
}
