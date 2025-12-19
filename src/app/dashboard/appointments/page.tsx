"use client";

import { useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Appointment } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateAppointmentDialog } from "@/components/dashboard/appointments/create-dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AppointmentsPage() {
  const { data: appointments, loading } = useFirestoreCollection<Appointment>("appointments");
  const { toast } = useToast();

  // Transform data for FullCalendar
  const events = appointments.map(appt => ({
      id: appt.id,
      title: appt.title || 'Untitled',
      start: appt.startTime, // ISO string works
      end: appt.endTime,
      backgroundColor: appt.status === 'confirmed' ? '#10b981' : '#f59e0b',
      borderColor: appt.status === 'confirmed' ? '#10b981' : '#f59e0b',
      extendedProps: { ...appt }
  }));

  const handleEventDrop = async (info: any) => {
      // Optimistic update handled by calendar, but need to sync DB
      try {
          const { event } = info;
          const newStart = event.start.toISOString();
          const newEnd = event.end?.toISOString() || new Date(event.start.getTime() + 60*60*1000).toISOString();

          await updateDoc(doc(db, "appointments", event.id), {
              startTime: newStart,
              endTime: newEnd,
              status: 'rescheduled'
          });
          
          toast({ title: "Rescheduled", description: "Appointment time updated." });
      } catch (e) {
          info.revert();
          toast({ title: "Error", description: "Could not reschedule.", variant: "destructive" });
      }
  };

  return (
    <div className="space-y-6 p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
       <div className="flex items-center justify-between shrink-0">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">Calendar & Appointments</h1>
             <p className="text-muted-foreground">Manage your schedule and consultations.</p>
          </div>
          <CreateAppointmentDialog>
              <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Appointment
              </Button>
          </CreateAppointmentDialog>
       </div>

       <Card className="flex-1 overflow-hidden">
           <CardContent className="p-0 h-full">
               <div className="h-full p-4">
                   <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        eventDrop={handleEventDrop}
                        height="100%"
                        slotMinTime="08:00:00"
                        slotMaxTime="18:00:00"
                        allDaySlot={false}
                        nowIndicator={true}
                        eventClick={(info) => {
                            // TODO: Open detail dialog
                            alert(`Clicked: ${info.event.title}`);
                        }}
                   />
               </div>
           </CardContent>
       </Card>
    </div>
  );
}
