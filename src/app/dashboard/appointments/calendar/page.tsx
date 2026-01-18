// src/app/dashboard/appointments/calendar/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, Link as LinkIcon } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, addMonths } from 'date-fns';
import { Appointment } from '@/types/schema';
import { CreateAppointmentDialog } from '@/components/dashboard/appointments/create-dialog';
import { AvailabilitySettingsDialog } from '@/components/dashboard/settings/availability-settings';
import { useAppointments } from '@/hooks/use-appointments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CalendarPage() {
    // Initialize with null to prevent hydration mismatch (server time vs client time)
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    // Stable reference for "Today" to avoid hydration mismatch on highlighting
    const [today, setToday] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-indigo-600"/> 
                        Calendar
                    </h1>
                    <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d ? addDays(d, -7) : new Date())}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-40 text-center font-medium text-sm">
                            {format(calendarData.weekStart, 'MMM d')} - {format(calendarData.weekEnd, 'MMM d, yyyy')}
                        </span>
                         <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d ? addDays(d, 7) : new Date())}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="flex gap-2">
                    <AvailabilitySettingsDialog />
                    <CreateAppointmentDialog />
                </div>
            </div>

            <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b bg-gray-50">
                     {calendarData.days.map(day => (
                         <div key={day.toISOString()} className="py-3 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0">
                             {format(day, 'EEEE')}
                         </div>
                     ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-gray-100">
                    {calendarData.days.map(day => {
                        const isToday = isSameDay(day, today);
                        const dayAppts = getAppointmentsForDay(day);
                        
                        return (
                            <div key={day.toISOString()} className={`flex flex-col h-full min-h-[120px] ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                <div className={`p-2 text-right text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="flex-1 p-1 space-y-1.5 overflow-y-auto">
                                    {dayAppts.map(appt => {
                                        const startTime = parseISO(appt.startAt);
                                        const endTime = parseISO(appt.endAt);
                                        const isZoom = appt.provider === 'zoom';
                                        const isTeams = appt.provider === 'teams';
                                        
                                        return (
                                            <Dialog key={appt.id}>
                                                <DialogTrigger asChild>
                                                    <div className={`p-2 text-xs rounded border cursor-pointer hover:shadow-md transition-all 
                                                        ${isZoom ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                                                          isTeams ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 
                                                          'bg-gray-50 border-gray-100 text-gray-700'}`
                                                    }>
                                                        <div className="font-bold flex justify-between">
                                                            <span>{format(startTime, 'HH:mm')}</span>
                                                        </div>
                                                        <div className="truncate font-medium mt-0.5">{appt.title}</div>
                                                        {isZoom && <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wide opacity-70"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Zoom</div>}
                                                        {isTeams && <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wide opacity-70"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Teams</div>}
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>{appt.title}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>{format(startTime, 'EEEE, MMMM do, yyyy')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
                                                        </div>
                                                        <div className="border-t pt-4">
                                                            <p className="text-sm text-gray-500 mb-2">Meeting Link</p>
                                                            {appt.meetingLink ? (
                                                                <Button variant="outline" className="w-full justify-start text-blue-600" onClick={() => window.open(appt.meetingLink, '_blank')}>
                                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                                    Join {appt.provider === 'zoom' ? 'Zoom' : 'Teams'} Meeting
                                                                </Button>
                                                            ) : (
                                                                <p className="text-sm italic text-gray-400">No online meeting link generated.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
