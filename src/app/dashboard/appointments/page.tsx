"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Appointment } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Video, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Calendar Imports
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: appointments, loading } = useFirestoreCollection<Appointment>("appointments", "startTime", "asc");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("consultation");
  const { toast } = useToast();
  const [view, setView] = useState(Views.MONTH);

  // Map Firestore appointments to Calendar events
  const events = appointments.map(appt => ({
      id: appt.id,
      title: appt.title,
      start: new Date(appt.startTime),
      end: new Date(appt.endTime),
      resource: appt
  }));

  const handleCreateAppointment = async () => {
    try {
        await addDoc(collection(db, "appointments"), {
            title: newTitle,
            initiator: "current_user",
            reason: newType,
            channel: 'video',
            startTime: new Date().toISOString(), // Mock immediate start
            endTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'confirmed',
            participants: ["student_1", "current_user"],
            createdAt: serverTimestamp()
        });
        setNewDialogOpen(false);
        toast({ title: "Scheduled", description: "Appointment created successfully." });
    } catch (e) {
        toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleSelectEvent = (event: any) => {
      if (event.resource.channel === 'video') {
          router.push(`/dashboard/consultations/${event.resource.caseId || 'new'}`);
      } else {
          toast({ title: event.title, description: "Viewing details..." });
      }
  };

  return (
    <div className="space-y-8 p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">Appointments</h1>
             <p className="text-muted-foreground">Manage your schedule and consultations.</p>
          </div>
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <Plus className="mr-2 h-4 w-4" /> Schedule New
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Book Appointment</DialogTitle>
                      <DialogDescription>Schedule a session with a student or parent.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Initial Assessment" />
                      </div>
                      <div className="space-y-2">
                          <Label>Reason</Label>
                          <Select value={newType} onValueChange={setNewType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="assessment">Assessment</SelectItem>
                                  <SelectItem value="therapy">Therapy</SelectItem>
                                  <SelectItem value="followUp">Follow-up</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="p-4 bg-muted rounded text-sm text-center">
                          AI Scheduler: "Finding optimal slot..."
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleCreateAppointment}>Confirm Booking</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
       </div>

       <div className="flex-1 bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm">
           <Calendar
               localizer={localizer}
               events={events}
               startAccessor="start"
               endAccessor="end"
               style={{ height: '100%' }}
               views={['month', 'week', 'day', 'agenda']}
               onSelectEvent={handleSelectEvent}
               eventPropGetter={(event) => {
                   let backgroundColor = '#3174ad';
                   if (event.resource.reason === 'assessment') backgroundColor = '#e11d48'; // red
                   if (event.resource.reason === 'therapy') backgroundColor = '#16a34a'; // green
                   return { style: { backgroundColor } };
               }}
           />
       </div>
    </div>
  );
}
