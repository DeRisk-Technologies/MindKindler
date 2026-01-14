// src/components/student360/SchoolDataPanel.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StudentRecord } from '@/types/schema';

// Extended interface matching Ingestion Worker
interface ExtendedStudent extends StudentRecord {
    timeline?: {
        academic?: {
            subject: string;
            grade: string;
            date: string;
            source: string;
        }[];
    };
    behavior?: any; // discipline or recentStats
    education?: any;
}

interface SchoolDataPanelProps {
    student: ExtendedStudent;
}

export function SchoolDataPanel({ student }: SchoolDataPanelProps) {
    // Extract Data safely
    const attainment = student.timeline?.academic?.filter(a => a.source === 'School Portal') || [];
    const stats = (student as any).behavior?.recentStats || { exclusions: 0, isolations: 0 };
    const attendance = (student as any).education?.attendancePercentage?.value;

    return (
        <Card className="border-blue-100 h-full">
            <CardHeader className="pb-3 bg-blue-50/30 border-b">
                <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" /> School Data (Section B/F)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                
                {/* 1. Attainment */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Current Attainment</h4>
                    {attainment.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">No attainment data submitted via portal.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="h-8 border-none">
                                    <TableHead className="h-8 text-xs font-medium pl-0">Subject</TableHead>
                                    <TableHead className="h-8 text-xs font-medium text-right">Grade</TableHead>
                                    <TableHead className="h-8 text-xs font-medium text-right pr-0">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attainment.slice(0, 5).map((a: any, i: number) => (
                                    <TableRow key={i} className="h-8 border-b-0">
                                        <TableCell className="py-1 text-xs pl-0">{a.subject}</TableCell>
                                        <TableCell className="py-1 text-xs font-bold text-right">{a.grade}</TableCell>
                                        <TableCell className="py-1 text-xs text-slate-400 text-right pr-0">{new Date(a.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* 2. Behavior Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-2 rounded border text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Attendance</div>
                        <div className={`text-lg font-bold ${attendance < 90 ? 'text-red-500' : 'text-green-600'}`}>
                            {attendance ? `${attendance}%` : '-'}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Exclusions</div>
                        <div className={`text-lg font-bold ${stats.exclusions > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                            {stats.exclusions}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Isolations</div>
                        <div className={`text-lg font-bold ${stats.isolations > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                            {stats.isolations}
                        </div>
                    </div>
                </div>

                {/* 3. Recent Intervention (Visual Placeholder) */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" /> Recent Interventions
                    </h4>
                    {/* 
                       Note: Full intervention history resides in 'interventions' subcollection. 
                       Here we show a hint that data exists or needs to be viewed.
                    */}
                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded italic">
                        Check the "Evidence Bank" tab for full intervention logs.
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
