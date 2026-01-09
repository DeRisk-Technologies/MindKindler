// src/app/dashboard/consultations/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    MessageSquare, 
    Calendar, 
    Clock, 
    User, 
    FileText, 
    Plus, 
    Loader2,
    Filter,
    Video,
    Sparkles
} from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

export default function ConsultationsPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Fix: Memoize filter to prevent loop
    const filterOptions = React.useMemo(() => ({
        field: 'practitionerId', 
        operator: '==', 
        value: user?.uid 
    }), [user?.uid]);

    const { data: consultations, loading } = useFirestoreCollection(
        'consultation_sessions', 
        'scheduledAt', 
        'desc',
        user?.uid ? { filter: filterOptions } : undefined
    );

    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredConsultations = consultations.filter(c => 
        filterStatus === 'all' || c.status === filterStatus
    );

    // Hydration guard for date rendering
    const formatDate = (dateString: string) => {
        if (!mounted) return "";
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (dateString: string) => {
        if (!mounted) return "";
        return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
                    <p className="text-muted-foreground">Manage your clinical sessions with students, parents, and staff.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/appointments/calendar">
                        <Button variant="outline">
                            <Calendar className="mr-2 h-4 w-4"/> View Calendar
                        </Button>
                    </Link>
                    
                    <Link href="/dashboard/consultations/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4"/> New Session
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative w-72">
                    <Input placeholder="Search participants..." className="pl-8" />
                    <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="w-[180px]">
                    <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Log</CardTitle>
                    <CardDescription>Launch the Live AI Cockpit for active sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Participant</TableHead>
                                <TableHead>Clinical Mode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && filteredConsultations.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No consultations found.</TableCell></TableRow>
                            )}
                            {filteredConsultations.map((session: any) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-slate-500"/> 
                                                {formatDate(session.scheduledAt)}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-2 ml-5">
                                                <Clock className="h-3 w-3"/>
                                                {formatTime(session.scheduledAt)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-indigo-500" />
                                            <div>
                                                <div className="font-medium">{session.participantName || "Unknown"}</div>
                                                <div className="text-xs text-muted-foreground capitalize">{session.participantType}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize bg-slate-50">
                                            {session.mode ? session.mode.replace('_', ' ') : "Standard"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {session.status === 'completed' && <Badge variant="default" className="bg-green-600">Completed</Badge>}
                                        {session.status === 'scheduled' && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>}
                                        {session.status === 'cancelled' && <Badge variant="destructive" className="bg-red-100 text-red-800">Cancelled</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* UPDATED: Link to the new LIVE Cockpit */}
                                            {session.status === 'scheduled' && (
                                                <Link href={`/dashboard/consultations/live/${session.id}`}>
                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                                                        <Video className="mr-2 h-3 w-3" /> Live Cockpit
                                                    </Button>
                                                </Link>
                                            )}
                                            
                                            {/* UPDATED: Link to the new POST-SESSION Synthesis for completed ones */}
                                            {session.status === 'completed' && (
                                                <Link href={`/dashboard/consultations/synthesis/${session.id}`}>
                                                    <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200">
                                                        <Sparkles className="mr-2 h-3 w-3" /> Synthesis
                                                    </Button>
                                                </Link>
                                            )}

                                            <Link href={`/dashboard/consultations/${session.id}`}>
                                                <Button variant="ghost" size="sm">Details</Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
