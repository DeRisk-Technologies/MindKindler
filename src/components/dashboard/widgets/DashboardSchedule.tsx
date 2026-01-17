// src/components/dashboard/widgets/DashboardSchedule.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppointments } from '@/hooks/use-appointments';
import { Calendar, Loader2, Video, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOfToday, endOfToday, format } from 'date-fns';
import Link from 'next/link';

export function DashboardSchedule() {
    // Fetch TODAY's appointments
    const { appointments, loading } = useAppointments(startOfToday(), endOfToday());

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Today's Schedule
                </CardTitle>
                <Link href="/dashboard/appointments/calendar">
                    <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                </Link>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                        <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">No appointments today.</p>
                        <p className="text-xs text-slate-400">Enjoy your focus time.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map(appt => (
                            <div key={appt.id} className="flex gap-3 items-start p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors group">
                                <div className="flex flex-col items-center min-w-[3rem]">
                                    <span className="text-xs font-bold text-slate-700">{format(new Date(appt.startAt), 'HH:mm')}</span>
                                    <span className="text-[10px] text-slate-400 uppercase">{format(new Date(appt.startAt), 'a')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-slate-900">{appt.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {appt.provider === 'zoom' || appt.provider === 'teams' ? (
                                            <span className="flex items-center text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                <Video className="w-3 h-3 mr-1" />
                                                Virtual
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                On-site
                                            </span>
                                        )}
                                        {appt.caseId && <span className="text-[10px] text-slate-400 border px-1 rounded">Case Linked</span>}
                                    </div>
                                </div>
                                {appt.joinUrl && (
                                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                        <a href={appt.joinUrl} target="_blank" rel="noopener noreferrer">
                                            <ArrowRight className="w-4 h-4 text-indigo-600" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
