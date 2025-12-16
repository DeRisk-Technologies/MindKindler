"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Clock, CalendarOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilitySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Mock State - In real app, load from Firestore User doc
  const [officeHours, setOfficeHours] = useState({
    start: "09:00",
    end: "17:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  });
  
  const [studentBookingAge, setStudentBookingAge] = useState(12);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API save
    setTimeout(() => {
        setIsSaving(false);
        toast({ title: "Availability Saved", description: "Your schedule has been updated." });
    }, 800);
  };

  const toggleDay = (day: string) => {
      if (officeHours.days.includes(day)) {
          setOfficeHours({...officeHours, days: officeHours.days.filter(d => d !== day)});
      } else {
          setOfficeHours({...officeHours, days: [...officeHours.days, day]});
      }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Scheduling Settings</h1>
        <p className="text-muted-foreground">
          Configure your availability, holidays, and booking rules.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Office Hours
                </CardTitle>
                <CardDescription>Set your standard working hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input type="time" value={officeHours.start} onChange={e => setOfficeHours({...officeHours, start: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input type="time" value={officeHours.end} onChange={e => setOfficeHours({...officeHours, end: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label>Working Days</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {DAYS.map(day => (
                            <div key={day} className="flex items-center space-x-2">
                                <Checkbox id={day} checked={officeHours.days.includes(day)} onCheckedChange={() => toggleDay(day)} />
                                <label htmlFor={day} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {day}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarOff className="h-5 w-5 text-red-500" />
                    Holidays & Rules
                </CardTitle>
                <CardDescription>Manage global rules and exceptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label>Student Self-Booking Minimum Age</Label>
                    <Input 
                        type="number" 
                        value={studentBookingAge} 
                        onChange={e => setStudentBookingAge(parseInt(e.target.value))} 
                        min={5} max={18}
                    />
                    <p className="text-xs text-muted-foreground">
                        Students below this age cannot schedule their own appointments.
                    </p>
                </div>
                <div className="border-t pt-4">
                    <Label>Upcoming Public Holidays</Label>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between"><span>Independence Day</span> <span>Oct 1</span></div>
                        <div className="flex justify-between"><span>Christmas Day</span> <span>Dec 25</span></div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 w-full">Add Holiday Exception</Button>
                </div>
            </CardContent>
        </Card>
      </div>

       <div className="flex justify-end">
         <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
         </Button>
       </div>
    </div>
  );
}
