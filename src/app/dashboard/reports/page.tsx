// src/app/dashboard/reports/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    FileText, Calendar, Clock, User, Download, Eye, Plus, Loader2, Search
} from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Input } from "@/components/ui/input";

export default function ReportsPage() {
    const { data: reports, loading } = useFirestoreCollection('reports', 'createdAt', 'desc');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReports = reports.filter(r => 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports Archive</h1>
                    <p className="text-muted-foreground">Manage statutory drafts, finalized documents, and shared outputs.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/reports/builder">
                        <Button>
                            <Plus className="mr-2 h-4 w-4"/> New Report
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-72">
                    <Input 
                        placeholder="Search reports..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && filteredReports.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reports found.</TableCell></TableRow>
                            )}
                            {filteredReports.map((report: any) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-indigo-500" />
                                            {report.title || "Untitled Report"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{report.studentName || "Unknown"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{report.type || "General"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {report.status === 'final' && <Badge className="bg-green-600">Final</Badge>}
                                        {report.status === 'draft' && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Draft</Badge>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/reports/editor/${report.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" /> Open
                                                </Button>
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
