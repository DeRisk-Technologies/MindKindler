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
    Filter
} from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

export default function ConsultationsPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // PROBLEM: useFirestoreCollection has a dependency on `user` (or permissions) internally.
    // If the hook causes a state update that triggers a re-render, and that re-render
    // causes the hook to re-run with a new object reference (e.g., `filter` object literal), 
    // it creates an infinite loop.
    
    // FIX 1: Memoize the filter object
    const filterOptions = React.useMemo(() => ({
        field: 'practitionerId', 
        operator: '==', 
        value: user?.uid 
    }), [user?.uid]);

    // Only run query if user is defined to avoid thrashing
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
                        <Button>
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
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Participant</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && filteredConsultations.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No consultations found.</TableCell></TableRow>
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
                                        <Badge variant="outline" className="capitalize">{session.type || "General"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {session.status === 'completed' && <Badge variant="default" className="bg-green-600">Completed</Badge>}
                                        {session.status === 'scheduled' && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>}
                                        {session.status === 'cancelled' && <Badge variant="destructive" className="bg-red-100 text-red-800">Cancelled</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm truncate max-w-[200px] block">
                                            {session.outcomeSummary || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/consultations/${session.id}`}>
                                            <Button variant="ghost" size="sm">View Notes</Button>
                                        </Link>
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
