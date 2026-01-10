// src/app/dashboard/reports/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    FileText, Calendar, User, Eye, Plus, Loader2, Search, ArrowRight, CheckCircle, Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function ReportsDirectoryPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Robust Real-time fetching from Shard
    useEffect(() => {
        if (!user) return;

        let unsubscribe: () => void;

        async function initRealtime() {
            try {
                // 1. Resolve Region
                let region = user?.region; // Safe Access
                if (!region || region === 'default') {
                    if (user?.uid) {
                        const routingRef = doc(globalDb, 'user_routing', user.uid);
                        const routingSnap = await getDoc(routingRef);
                        region = routingSnap.exists() ? routingSnap.data().region : 'uk';
                    } else {
                        region = 'uk';
                    }
                }

                const targetDb = getRegionalDb(region);
                console.log(`[Reports] Listing from shard: ${region}`);

                // 2. Setup Listener
                const q = query(collection(targetDb, 'reports'), orderBy('createdAt', 'desc'));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    setReports(data);
                    setLoading(false);
                }, (err) => {
                    console.error("Listener error", err);
                    setLoading(false);
                });

            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        }

        initRealtime();
        return () => unsubscribe?.();
    }, [user]);

    const filteredReports = reports.filter(r => 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clinical Reports Directory</h1>
                    <p className="text-muted-foreground">Access and manage all statutory drafts and finalized documentation.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/reports/builder">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4"/> New Report
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search reports or students..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[300px]">Document Title</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin inline h-6 w-6 text-indigo-500"/></TableCell></TableRow>
                            ) : filteredReports.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No clinical reports found in your directory.</TableCell></TableRow>
                            ) : (
                                filteredReports.map((report: any) => (
                                    <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-lg">
                                                    <FileText className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="font-semibold text-slate-800">{report.title || "Untitled Report"}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-sm font-medium">{report.studentName || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {report.status === 'final' ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 flex w-fit gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Finalized
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 flex w-fit gap-1">
                                                    <Clock className="h-3 w-3" /> Draft
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 font-medium">
                                            {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/reports/editor/${report.id}`}>
                                                <Button variant="outline" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                                                    Open Editor <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
