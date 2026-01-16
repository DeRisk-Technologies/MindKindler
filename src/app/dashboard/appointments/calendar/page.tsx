"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { Appointment } from '@/types/schema';
import { CreateAppointmentDialog } from '@/components/dashboard/appointments/create-dialog';
import { AvailabilitySettingsDialog } from '@/components/dashboard/settings/availability-settings';
import { useAppointments } from '@/hooks/use-appointments';

export default function CalendarPage() {
    // Initialize with null to prevent hydration mismatch (server time vs client time)
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    // Stable reference for "Today" to avoid hydration mismatch on highlighting
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        const now = new Date();
        setCurrentDate(now);
        setToday(now);
    }, []);

    const calendarData = useMemo(() => {
        if (!currentDate) return null;
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        return { weekStart, weekEnd, days };
    }, [currentDate]);

    // Real Data Fetching
    const { appointments, loading } = useAppointments(
        calendarData?.weekStart || new Date(), 
        calendarData?.weekEnd || new Date()
    );

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(a => a.startAt.startsWith(dateStr));
    };

    if (!currentDate || !today || !calendarData) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading calendar...
            </div>
        );
    }

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
                            {format(calendarData.weekStart, 'MMM d')} - {format(calendarData.weekEnd, 'MMM d')}
                        </span>
                         <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d ? addDays(d, 7) : new Date())}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <AvailabilitySettingsDialog />
                </div>
                <CreateAppointmentDialog />
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded-lg overflow-hidden flex-1 min-h-[600px]">
                {calendarData.days.map(day => {
                    const isToday = isSameDay(day, today);
                    return (
                        <div key={day.toISOString()} className="bg-white flex flex-col h-full">
                            <div className={`p-2 text-center text-sm font-medium border-b ${isToday ? 'bg-blue-50 text-blue-600' : ''}`}>
                                {format(day, 'EEE')} <span className="text-gray-500">{format(day, 'd')}</span>
                            </div>
                            <div className="flex-1 p-2 space-y-2">
                                {getAppointmentsForDay(day).map(appt => {
                                    const startTime = parseISO(appt.startAt);
                                    return (
                                        <div key={appt.id} className="p-2 text-xs rounded border bg-blue-50 border-blue-100 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors">
                                            <div className="font-bold">{format(startTime, 'HH:mm')}</div>
                                            <div className="truncate">{appt.title}</div>
                                            {appt.provider === 'zoom' && <div className="text-[9px] uppercase tracking-tighter text-blue-400 mt-1">Zoom</div>}
                                            {appt.provider === 'teams' && <div className="text-[9px] uppercase tracking-tighter text-indigo-400 mt-1">Teams</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
