"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { Appointment } from '@/types/schema';
import { CreateAppointmentDialog } from '@/components/dashboard/appointments/create-dialog';

export default function CalendarPage() {
    // Initialize with null to prevent hydration mismatch (server time vs client time)
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    if (!currentDate) {
        return <div className="p-8 text-center text-muted-foreground">Loading calendar...</div>;
    }

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Mock Appointments (simulating data fetching)
    const appointments: Partial<Appointment>[] = [
        { 
            id: '1', 
            title: 'Consultation - John Doe', 
            startAt: addDays(weekStart, 1).toISOString().replace(/T.*/, 'T10:00:00'), // Tuesday 10am
            type: 'consultation',
            status: 'scheduled'
        },
        { 
            id: '2', 
            title: 'Team Meeting', 
            startAt: addDays(weekStart, 3).toISOString().replace(/T.*/, 'T14:00:00'), // Thursday 2pm
            type: 'follow_up',
            status: 'scheduled'
        }
    ];

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(a => a.startAt?.startsWith(dateStr));
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Calendar</h1>
                    <div className="flex items-center border rounded-md bg-white">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d ? addDays(d, -7) : new Date())}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-32 text-center font-medium text-sm">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                        </span>
                         <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d ? addDays(d, 7) : new Date())}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <CreateAppointmentDialog />
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded-lg overflow-hidden flex-1 min-h-[600px]">
                {days.map(day => (
                    <div key={day.toISOString()} className="bg-white flex flex-col h-full">
                        <div className={`p-2 text-center text-sm font-medium border-b ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50 text-blue-600' : ''}`}>
                            {format(day, 'EEE')} <span className="text-gray-500">{format(day, 'd')}</span>
                        </div>
                        <div className="flex-1 p-2 space-y-2">
                            {getAppointmentsForDay(day).map(appt => {
                                const startTime = appt.startAt ? parseISO(appt.startAt) : new Date();
                                return (
                                    <div key={appt.id} className="p-2 text-xs rounded border bg-blue-50 border-blue-100 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors">
                                        <div className="font-bold">{format(startTime, 'HH:mm')}</div>
                                        <div className="truncate">{appt.title}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
