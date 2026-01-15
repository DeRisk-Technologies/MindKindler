"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { SafeguardingEvent } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, ChevronRight, AlertTriangle, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SafeguardingDashboard() {
    // Query the authoritative audit log
    const { data: events, loading } = useFirestoreCollection<SafeguardingEvent>("safeguarding_events", "timestamp", "desc");
    const [selectedEvent, setSelectedEvent] = useState<SafeguardingEvent | null>(null);
    const router = useRouter();

    // Stats
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'immediate_danger' || e.severity === 'high').length;
    const last7Days = events.filter(e => new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'immediate_danger': return <Badge variant="destructive" className="animate-pulse">IMMEDIATE DANGER</Badge>;
            case 'high': return <Badge variant="destructive">High Risk</Badge>;
            case 'moderate': return <Badge className="bg-orange-500 hover:bg-orange-600">Moderate</Badge>;
            default: return <Badge variant="secondary">Low</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header & Stats */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                        Safeguarding Governance
                    </h1>
                    <p className="text-slate-500">Clinical safety audit log and escalation monitoring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-red-600 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Critical Incidents (All Time)</CardTitle></CardHeader>
                        <CardContent><div className="text-3xl font-bold text-red-600">{criticalEvents}</div></CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Active Alerts (7 Days)</CardTitle></CardHeader>
                        <CardContent><div className="text-3xl font-bold text-slate-800">{last7Days}</div></CardContent>
                    </Card>
                    <Card className="shadow-sm bg-slate-900 text-white">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Total Audit Logs</CardTitle></CardHeader>
                        <CardContent><div className="text-3xl font-bold">{totalEvents}</div></CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Audit Log Table */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b bg-white">
                    <CardTitle className="text-lg">Crisis Audit Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Actions Taken</TableHead>
                                <TableHead className="text-right">Audit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading secure logs...</TableCell></TableRow>}
                            
                            {!loading && events.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle2 className="h-12 w-12 text-emerald-100 mb-2" />
                                            No safeguarding incidents recorded.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {events.map(event => (
                                <TableRow key={event.id} className="group hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-700">
                                        <div className="flex flex-col">
                                            <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                                            <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {event.studentId} {/* In real app, resolve name */}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {event.category?.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {event.actionsTaken?.some(a => a.channel.includes('email')) && (
                                                <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200"><Mail className="h-3 w-3"/> Email</Badge>
                                            )}
                                            {event.actionsTaken?.some(a => a.channel.includes('call')) && (
                                                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200"><Phone className="h-3 w-3"/> Call</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(event)}>
                                            Review <ChevronRight className="ml-2 h-4 w-4 opacity-50"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detailed Audit Dialog */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            Safeguarding Event Detail
                        </DialogTitle>
                        <div className="text-xs text-slate-400 font-mono mt-1">ID: {selectedEvent?.id}</div>
                    </DialogHeader>

                    {selectedEvent && (
                        <div className="space-y-6 py-4">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Timestamp</div>
                                    <div className="text-sm font-medium">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Reported By</div>
                                    <div className="text-sm font-medium">{selectedEvent.reportedBy}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Risk Category</div>
                                    <div className="text-sm font-medium capitalize">{selectedEvent.category.replace('_', ' ')}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Severity</div>
                                    <div>{getSeverityBadge(selectedEvent.severity)}</div>
                                </div>
                            </div>

                            {/* Clinical Note */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-2">Clinical Note / Justification</h3>
                                <div className="p-4 bg-red-50 border border-red-100 rounded text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                    {selectedEvent.description}
                                </div>
                            </div>

                            {/* Action Log */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-2">Communication Log</h3>
                                <div className="space-y-3">
                                    {selectedEvent.actionsTaken.map((action, i) => (
                                        <div key={i} className="border rounded-lg p-3 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    {action.channel.includes('email') ? <Mail className="h-4 w-4 text-blue-500"/> : <Phone className="h-4 w-4 text-green-500"/>}
                                                    <span className="font-semibold text-sm">Contacted {action.role}</span>
                                                </div>
                                                <Badge variant={action.status === 'sent' ? 'default' : 'destructive'}>{action.status}</Badge>
                                            </div>
                                            <div className="text-xs text-slate-500 pl-6">
                                                ID: {action.contactId} • {new Date(action.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close Audit Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Icon Helper
function CheckCircle2(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
}
