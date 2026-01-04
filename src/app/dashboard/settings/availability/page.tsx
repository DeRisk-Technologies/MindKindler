"use client";

import { AvailabilitySettingsDialog } from '@/components/dashboard/settings/availability-settings';

export default function AvailabilityPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Availability & Scheduling</h2>
                   <p className="text-muted-foreground">Configure your working hours, leave, and emergency contacts.</p>
                </div>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
                 <div className="flex flex-col items-center justify-center space-y-4 py-8">
                     <p className="text-center text-muted-foreground max-w-md">
                         Manage all your scheduling preferences, including regional holidays, leave substitutes, and calendar integrations in one place.
                     </p>
                     <AvailabilitySettingsDialog />
                 </div>
            </div>
        </div>
    );
}
