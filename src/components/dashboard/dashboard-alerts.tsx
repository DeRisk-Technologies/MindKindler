"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Appointment } from "@/types/schema";
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight, Download, Info } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMarketplaceUpdates } from "@/hooks/use-marketplace-updates";

interface DashboardAlert {
    id: string;
    title: string;
    type: 'warning' | 'info' | 'success';
    actionLink?: string;
    actionLabel?: string;
}

export function DashboardAlerts() {
  const router = useRouter();
  const { data: appointments } = useFirestoreCollection<Appointment>("appointments", "startAt", "asc"); // Fixed sort field
  const { updatesAvailable, newModulesAvailable } = useMarketplaceUpdates();
  
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  useEffect(() => {
      const now = new Date();
      // Filter upcoming appointments (next 7 days)
      const next = appointments.filter(a => {
          const date = new Date(a.startAt); // Fixed field name
          return date >= now && date <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }).slice(0, 3);
      setUpcoming(next);

      // Base System Alerts (Mocked for Demo - e.g. from Compliance Engine)
      const systemAlerts: DashboardAlert[] = [
          { 
              id: 'sys-1', 
              title: '3 Pending Assessment Reviews', 
              type: 'warning',
              actionLink: '/dashboard/assessments',
              actionLabel: 'Review'
          }
      ];

      // Merge with Marketplace Alerts
      const marketUpdates: DashboardAlert[] = updatesAvailable.map(u => ({
          id: `update-${u.manifest.id}`,
          title: `Update Available: ${u.manifest.name} v${u.latestVersion}`,
          type: 'warning',
          actionLink: '/dashboard/marketplace',
          actionLabel: 'Update'
      }));

      const marketNew: DashboardAlert[] = newModulesAvailable.map(m => ({
          id: `new-${m.manifest.id}`,
          title: `New Module for ${m.manifest.regionTags[0] || 'Region'}: '${m.manifest.name}'`,
          type: 'info',
          actionLink: '/dashboard/marketplace',
          actionLabel: 'View'
      }));

      setAlerts([...systemAlerts, ...marketUpdates, ...marketNew]);

  }, [appointments, updatesAvailable, newModulesAvailable]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Upcoming Schedule</CardTitle>
                    <CardDescription>Your appointments for the next 7 days.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/appointments')}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcoming.length === 0 && <p className="text-muted-foreground text-sm">No upcoming appointments.</p>}
                    {upcoming.map(appt => (
                        <div key={appt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{appt.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(appt.startAt), "MMM d, h:mm a")}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={appt.status === 'scheduled' ? 'default' : 'secondary'}>
                                {appt.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Actionable Alerts */}
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>Tasks & Updates requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                            {alert.type === 'warning' ? (
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                            ) : (
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                                    {alert.title}
                                </p>
                                {alert.actionLink && (
                                    <Button 
                                        variant="link" 
                                        className={`h-auto p-0 text-xs ${alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}
                                        onClick={() => router.push(alert.actionLink!)}
                                    >
                                        {alert.actionLabel || 'Take Action'} <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && <p className="text-muted-foreground text-sm">All caught up!</p>}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
