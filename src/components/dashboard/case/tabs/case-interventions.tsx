"use client";

import { useState } from "react";
import { Case, Intervention } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, UserCheck, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CaseInterventionsProps {
  caseData: Case;
}

export function CaseInterventions({ caseData }: CaseInterventionsProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock Interventions
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: "int_1",
      caseId: caseData.id,
      type: "Speech Therapy",
      startDate: "2023-10-01",
      frequency: "Weekly",
      status: "in-progress",
      assignedTo: "Dr. Emily (Speech Pathologist)"
    },
    {
      id: "int_2",
      caseId: caseData.id,
      type: "Reading Support Group",
      startDate: "2023-09-15",
      frequency: "Bi-weekly",
      status: "completed",
      outcomes: "Improved phonemic awareness"
    }
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Interventions</h3>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Intervention
          </Button>
        </div>

        {interventions.map((intervention) => (
          <Card key={intervention.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{intervention.type}</CardTitle>
                  <CardDescription>
                    {intervention.frequency} • Started {new Date(intervention.startDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={intervention.status === 'in-progress' ? 'default' : 'secondary'}>
                  {intervention.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserCheck className="mr-2 h-4 w-4" />
                  {intervention.assignedTo || "Unassigned"}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Log Session</Button>
                  {intervention.status === 'in-progress' && (
                     <Button variant="ghost" size="icon" title="Join Tele-Session">
                       <Video className="h-4 w-4 text-blue-500" />
                     </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Intervention Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Select an intervention to view detailed progress charts and session logs.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Upcoming Sessions</h4>
              <div className="text-sm p-2 border rounded bg-muted/20">
                <p className="font-medium">Speech Therapy</p>
                <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
