"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function AvailabilityPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const [workingDays, setWorkingDays] = useState(days);
  
  return (
    <div className="space-y-8 p-8 pt-6 max-w-4xl mx-auto">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Availability Settings</h1>
            <p className="text-muted-foreground">Configure when you are available for consultations.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>Set your standard weekly schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {days.map(day => (
                    <div key={day} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Switch checked={workingDays.includes(day)} onCheckedChange={(c) => {
                                if(c) setWorkingDays([...workingDays, day]);
                                else setWorkingDays(workingDays.filter(d => d !== day));
                            }} />
                            <span className="font-medium w-12">{day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select defaultValue="09:00">
                                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="08:00">08:00</SelectItem>
                                    <SelectItem value="09:00">09:00</SelectItem>
                                    <SelectItem value="10:00">10:00</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>to</span>
                            <Select defaultValue="17:00">
                                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:00">16:00</SelectItem>
                                    <SelectItem value="17:00">17:00</SelectItem>
                                    <SelectItem value="18:00">18:00</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Time Off & Holidays</CardTitle>
            </CardHeader>
            <CardContent>
                 <Button variant="outline">Block Dates</Button>
            </CardContent>
        </Card>
    </div>
  );
}
