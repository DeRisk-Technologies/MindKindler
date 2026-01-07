// src/components/dashboard/widgets/MyCaseload.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookUser, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MyCaseload() {
    // In prod: Fetch assigned cases/tasks
    const pendingAssessments = [
        { id: '1', name: 'Leo M.', type: 'WISC-V', due: '2 days' },
        { id: '2', name: 'Noah T.', type: 'Obs', due: 'Today' }
    ];

    const draftReports = [
        { id: '101', title: 'EHCP Draft - Leo M.', status: 'Drafting' }
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <BookUser className="h-4 w-4 text-indigo-600" />
                        Pending Assessments
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-2">
                        {pendingAssessments.map(a => (
                            <div key={a.id} className="flex justify-between items-center p-2 rounded bg-indigo-50 border border-indigo-100">
                                <div>
                                    <p className="font-medium text-sm text-indigo-900">{a.name}</p>
                                    <p className="text-xs text-indigo-700">{a.type} • Due {a.due}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                                    <Link href={`/dashboard/students/${a.id}`}><ChevronRight className="h-4 w-4"/></Link>
                                </Button>
                            </div>
                        ))}
                        {pendingAssessments.length === 0 && <p className="text-muted-foreground text-sm">No pending assessments.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        Draft Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-2">
                        {draftReports.map(r => (
                            <div key={r.id} className="flex justify-between items-center p-2 rounded bg-purple-50 border border-purple-100">
                                <div>
                                    <p className="font-medium text-sm text-purple-900">{r.title}</p>
                                    <Badge variant="outline" className="text-[10px] bg-white">{r.status}</Badge>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                                    <Link href="/dashboard/reports/builder"><ChevronRight className="h-4 w-4"/></Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
