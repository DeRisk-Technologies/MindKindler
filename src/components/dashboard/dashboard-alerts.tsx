"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Appointment } from "@/types/schema";
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DashboardAlerts() {
  const router = useRouter();
  const { data: appointments } = useFirestoreCollection<Appointment>("appointments", "startTime", "asc");
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<{ id: string, title: string, type: 'warning' | 'info' }[]>([]);

  useEffect(() => {
      const now = new Date();
      // Filter upcoming appointments (next 7 days)
      const next = appointments.filter(a => {
          const date = new Date(a.startTime);
          return date >= now && date <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }).slice(0, 3);
      setUpcoming(next);

      // Mock Alerts (In real app, query 'alerts' collection or generate from data)
      setAlerts([
          { id: '1', title: '3 Pending Assessment Reviews', type: 'warning' },
          { id: '2', title: 'New policy update available', type: 'info' }
      ]);
  }, [appointments]);

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
                                        {format(new Date(appt.startTime), "MMM d, h:mm a")}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'}>
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
                <CardDescription>Tasks requiring your attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/40">
                            {alert.type === 'warning' ? (
                                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                            <div>
                                <p className="text-sm font-medium">{alert.title}</p>
                                <Button variant="link" className="h-auto p-0 text-xs text-primary">
                                    Take Action
                                </Button>
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
