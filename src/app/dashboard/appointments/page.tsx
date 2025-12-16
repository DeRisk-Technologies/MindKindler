"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, getDay, parseISO } from "date-fns";
import { CalendarIcon, Plus, Video, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Fallback if custom one fails
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to determine allowed roles for a student to book
const STUDENT_ALLOWED_ROLES = ['educationalpsychologist', 'counselor'];

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  participantId: z.string().min(1, "Participant is required"),
  type: z.enum(["assessment", "counseling", "follow-up", "meeting"]),
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

export default function AppointmentsPage() {
  const { data: appointmentsRaw, loading } = useFirestoreCollection<any>("appointments", "date", "asc");
  const { data: users } = useFirestoreCollection<any>("users", "displayName", "asc");
  
  const { toast } = useToast();
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [searchRole, setSearchRole] = useState<string>("all");

  // Fetch current user and their detailed profile
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
        if (u) {
            setCurrentUser(u);
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) setCurrentUserData(snap.data());
        }
    });
    // Fix: unsub is a function that returns void, so we call it.
    // However, onAuthStateChanged returns an Unsubscribe function directly.
    return () => unsub();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "assessment",
      time: "09:00",
    },
  });

  // Filter users based on searchRole
  const filteredUsers = users.filter(u => {
      if (searchRole === 'all') return true;
      return u.role === searchRole;
  });

  // Filter appointments for the calendar view
  // In real app, we would query Firestore by date range
  const appointments = appointmentsRaw.map(a => ({
      ...a,
      dateObj: new Date(a.date) // Convert string date to Object for comparison
  }));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Permission Check: Student Age
    if (currentUserData?.role === 'student') {
        // Mock check - assume age is stored or derived. 
        // For prototype, we check the role of the target participant.
        const targetUser = users.find(u => u.id === values.participantId);
        
        // Check if student is under age (mock value from settings, default 12)
        const age = 10; // Mock current student age
        const minAge = 12; // Mock setting

        if (age < minAge) {
             toast({
                title: "Permission Denied",
                description: "You are too young to schedule appointments alone. Please ask a parent.",
                variant: "destructive"
             });
             return;
        }

        if (targetUser && !STUDENT_ALLOWED_ROLES.includes(targetUser.role)) {
             toast({
                title: "Restricted",
                description: "Students can only book Educational Psychologists or Counselors.",
                variant: "destructive"
             });
             return;
        }
    }

    try {
        const targetUser = users.find(u => u.id === values.participantId);

        // Combine Date and Time
        const [hours, minutes] = values.time.split(':').map(Number);
        const appointmentDate = new Date(values.date);
        appointmentDate.setHours(hours, minutes);

        await addDoc(collection(db, "appointments"), {
            title: values.title,
            studentName: currentUserData?.role === 'student' ? currentUserData.displayName : targetUser?.displayName, 
            // Logic depends on who books: if EPP books, target is student. If student books, target is EPP.
            // For generic "any role books any role", we just store participants array.
            participants: [auth.currentUser?.uid, values.participantId],
            type: values.type,
            date: appointmentDate.toISOString(),
            status: 'upcoming',
            createdAt: serverTimestamp(),
        });

        toast({
            title: "Appointment Scheduled",
            description: `Scheduled with ${targetUser?.displayName} on ${format(values.date, "PPP")} at ${values.time}.`,
        });
        setIsDialogOpen(false);
        form.reset();
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  const handleStartCall = (id: string) => {
    router.push(`/dashboard/call/${id}`);
  };

  // Custom Calendar Render Logic
  const renderCalendar = () => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, "d");
            const cloneDay = day;
            const isToday = isSameDay(day, new Date());
            const isSelectedMonth = isSameMonth(day, monthStart);
            
            // Find appointments for this day
            const dayApts = appointments.filter(a => isSameDay(new Date(a.date), day));

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "h-24 md:h-32 border p-1 md:p-2 transition-colors relative overflow-hidden group hover:bg-muted/30",
                        !isSelectedMonth && "bg-secondary/30 text-muted-foreground",
                        isToday && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => setDate(cloneDay)}
                >
                    <div className="flex justify-between items-start">
                         <span className={cn(
                             "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                             isToday && "bg-primary text-primary-foreground"
                         )}>
                             {formattedDate}
                         </span>
                         {dayApts.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1">{dayApts.length}</Badge>}
                    </div>
                    
                    <div className="mt-1 space-y-1">
                        {dayApts.slice(0, 3).map((apt, idx) => (
                             <div key={idx} className={cn(
                                 "text-[10px] truncate px-1 py-0.5 rounded border-l-2",
                                 apt.type === 'assessment' ? "bg-purple-100 text-purple-700 border-purple-500" :
                                 apt.type === 'counseling' ? "bg-green-100 text-green-700 border-green-500" :
                                 "bg-blue-100 text-blue-700 border-blue-500"
                             )}>
                                 {format(new Date(apt.date), 'HH:mm')} {apt.title || apt.studentName}
                             </div>
                        ))}
                        {dayApts.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+ {dayApts.length - 3} more</div>}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }
    return <div className="rounded-md border shadow-sm bg-background">{rows}</div>;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Schedule</h1>
          <p className="text-muted-foreground">
            Manage appointments and availability.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
              <DialogDescription>
                Book a session with a user.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Weekly Check-in" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                     <FormLabel>Participant Role Filter</FormLabel>
                     <Select onValueChange={setSearchRole} defaultValue="all">
                        <SelectTrigger><SelectValue placeholder="Filter by Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="educationalpsychologist">Educational Psychologists</SelectItem>
                            <SelectItem value="teacher">Teachers</SelectItem>
                            <SelectItem value="parent">Parents</SelectItem>
                            <SelectItem value="student">Students</SelectItem>
                        </SelectContent>
                     </Select>
                </div>

                <FormField
                  control={form.control}
                  name="participantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Person</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredUsers.map(u => (
                              <SelectItem key={u.id} value={u.id || u.uid}>
                                  {u.displayName} ({u.role})
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="counseling">Counseling</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="meeting">General Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Schedule</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-primary">{format(date, "MMMM yyyy")}</h2>
              <div className="flex items-center rounded-md border bg-background">
                  <Button variant="ghost" size="icon" onClick={() => setDate(subMonths(date, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDate(new Date())} className="text-xs font-medium">Today</Button>
                  <Button variant="ghost" size="icon" onClick={() => setDate(addMonths(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
          </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-px bg-muted/20 rounded-t-md text-center py-2 text-sm font-medium text-muted-foreground">
           {weekDays.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar Grid */}
      {renderCalendar()}

      {/* List View for Upcoming */}
      <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your chronological agenda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments
               .filter(a => new Date(a.date) >= new Date())
               .slice(0, 5)
               .map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
                        apt.type === 'assessment' ? "bg-purple-500" : 
                        apt.type === 'counseling' ? "bg-green-500" : "bg-blue-500"
                    )}>
                        {apt.studentName?.[0] || "A"}
                    </div>
                    <div>
                      <h4 className="font-semibold">{apt.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                         <span className="font-medium text-foreground">{apt.studentName}</span>
                         <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(apt.date), "PPP")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.date), "p")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button 
                          size="sm" 
                          variant="default" 
                          className="gap-2 rounded-full"
                          onClick={() => handleStartCall(apt.id)}
                        >
                          <Video className="h-4 w-4" />
                          Join
                        </Button>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && <div className="text-center text-muted-foreground py-4">No upcoming appointments.</div>}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
