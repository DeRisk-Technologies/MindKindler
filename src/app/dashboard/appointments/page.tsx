"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Appointment } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Clock, Video, MapPin, User, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: appointments, loading } = useFirestoreCollection<Appointment>("appointments", "startTime", "asc");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("consultation");
  const { toast } = useToast();

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

  const upcomingAppointments = appointments.filter(a => new Date(a.startTime) > new Date());
  const pastAppointments = appointments.filter(a => new Date(a.startTime) <= new Date());

  return (
    <div className="space-y-8 p-8 pt-6">
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
                          AI Scheduler Placeholder: "Find a slot next Tuesday..."
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleCreateAppointment}>Confirm Booking</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
       </div>

       {/* Upcoming Section */}
       <div className="space-y-4">
           <h2 className="text-xl font-semibold flex items-center gap-2">
               <CalendarIcon className="h-5 w-5 text-indigo-500" /> Upcoming
           </h2>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {upcomingAppointments.length === 0 && <p className="text-muted-foreground text-sm col-span-3">No upcoming appointments.</p>}
               {upcomingAppointments.map((appt) => (
                   <Card key={appt.id} className="border-l-4 border-l-indigo-500">
                       <CardHeader className="pb-2">
                           <div className="flex justify-between items-start">
                               <Badge variant="outline" className="uppercase text-[10px]">{appt.reason}</Badge>
                               {appt.channel === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                           </div>
                           <CardTitle className="text-base pt-2">{appt.title}</CardTitle>
                           <CardDescription>
                               {new Date(appt.startTime).toLocaleDateString()} at {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </CardDescription>
                       </CardHeader>
                       <CardContent>
                           <div className="flex flex-col gap-3">
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <User className="h-4 w-4" />
                                   <span>Participants: {appt.participants.length}</span>
                               </div>
                               {appt.channel === 'video' && (
                                   <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/dashboard/consultations/${appt.caseId || 'new'}`)}>
                                       <Video className="mr-2 h-4 w-4" /> Join Session
                                   </Button>
                               )}
                           </div>
                       </CardContent>
                   </Card>
               ))}
           </div>
       </div>

        {/* Past Section */}
        <div className="space-y-4 pt-8 border-t">
           <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
               <Clock className="h-5 w-5" /> Past History
           </h2>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75">
               {pastAppointments.map((appt) => (
                   <Card key={appt.id}>
                       <CardHeader className="pb-2">
                           <CardTitle className="text-sm">{appt.title}</CardTitle>
                           <CardDescription className="text-xs">
                               {new Date(appt.startTime).toLocaleDateString()}
                           </CardDescription>
                       </CardHeader>
                       <CardContent>
                           <Badge variant="secondary">{appt.status}</Badge>
                       </CardContent>
                   </Card>
               ))}
           </div>
       </div>
    </div>
  );
}
