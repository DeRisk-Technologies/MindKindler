// src/components/dashboard/students/tabs/HistoryTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';
import { 
    AlertTriangle, Plus, FileSpreadsheet, TrendingUp, TrendingDown, AlertCircle, Calendar 
} from 'lucide-react';
import { StudentRecord, StudentHistory, HistoricalAcademicRecord, HistoricalAttendanceSummary, DisciplineIncident } from '@/types/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoryTabProps {
    student: StudentRecord;
}

// Mock Data if empty
const MOCK_HISTORY: StudentHistory = {
    academic: [
        { id: '1', studentId: 's1', academicYear: '2021-2022', term: 'Spring', subject: 'Math', grade: 78, type: 'Term', source: 'LMS', date: '2022-04-01', metadata: { verified: true, source: 'lms' } },
        { id: '2', studentId: 's1', academicYear: '2022-2023', term: 'Fall', subject: 'Math', grade: 82, type: 'Term', source: 'LMS', date: '2022-12-01', metadata: { verified: true, source: 'lms' } },
        { id: '3', studentId: 's1', academicYear: '2022-2023', term: 'Spring', subject: 'Math', grade: 85, type: 'Term', source: 'LMS', date: '2023-04-01', metadata: { verified: true, source: 'lms' } },
    ],
    attendance: [
        { id: 'a1', studentId: 's1', academicYear: '2021-2022', totalDays: 190, daysPresent: 180, daysAbsent: 10, daysLate: 2, unauthorizedAbsences: 0, attendancePercentage: 94.7, source: 'LMS', metadata: { verified: true, source: 'lms' } },
        { id: 'a2', studentId: 's1', academicYear: '2022-2023', totalDays: 190, daysPresent: 165, daysAbsent: 25, daysLate: 5, unauthorizedAbsences: 5, attendancePercentage: 86.8, source: 'LMS', metadata: { verified: true, source: 'lms' } },
    ],
    behavior: [
        { id: 'b1', date: '2022-11-15', type: 'Disruption', description: 'Disrupted class repeatedly.', severity: 'low', outcome: 'Verbal Warning', reportedBy: 'Teacher', metadata: { verified: true, source: 'manual' } },
        { id: 'b2', date: '2023-01-20', type: 'Aggression', description: 'Pushed another student.', severity: 'medium', outcome: 'Detention', reportedBy: 'Playground Monitor', metadata: { verified: true, source: 'manual' } }
    ]
};

export function HistoryTab({ student }: HistoryTabProps) {
    const history = student.timeline || MOCK_HISTORY;
    const [activeTab, setActiveTab] = useState('overview');

    // --- Gap Finder Logic ---
    const gaps = useMemo(() => {
        const foundGaps = [];
        const years = ['2020-2021', '2021-2022', '2022-2023', '2023-2024']; // In real app, generate from enrollmentDate
        
        years.forEach(year => {
            const hasAttendance = history.attendance.some(a => a.academicYear === year);
            const hasAcademic = history.academic.some(a => a.academicYear === year);
            
            if (!hasAttendance) foundGaps.push({ year, type: 'Attendance', severity: 'high' });
            if (!hasAcademic) foundGaps.push({ year, type: 'Academic', severity: 'medium' });
        });
        return foundGaps;
    }, [history]);

    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        // Merge attendance and behavior by Year
        const years = Array.from(new Set([...history.attendance.map(a => a.academicYear), ...history.behavior.map(b => b.date.substring(0, 4))])).sort();
        
        return history.attendance.map(att => {
            // Count behavior incidents in this academic year
            // Assuming academic year starts in Sept. Simple check: verify if date falls in range.
            // For simplicity, we match string years or rough parsing.
            const incidents = history.behavior.filter(b => {
                const bYear = parseInt(b.date.substring(0, 4));
                const attStart = parseInt(att.academicYear.split('-')[0]);
                return bYear === attStart || bYear === attStart + 1;
            }).length;

            return {
                name: att.academicYear,
                attendance: att.attendancePercentage,
                incidents: incidents
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [history]);

    return (
        <div className="space-y-6">
            
            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Historical Attendance Avg</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(history.attendance.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / (history.attendance.length || 1)).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Across {history.attendance.length} academic years</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recorded Incidents</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{history.behavior.length}</div>
                        <p className="text-xs text-muted-foreground">Total behavioral events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {gaps.length > 0 ? 'Partial' : 'Complete'}
                        </div>
                        <p className="text-xs text-muted-foreground">{gaps.length} gaps detected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gap Alerts */}
            {gaps.length > 0 && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Missing Historical Data</AlertTitle>
                    <AlertDescription>
                        The Time-Machine engine detected gaps: 
                        {gaps.map((g, i) => (
                            <span key={i} className="font-semibold ml-1">
                                {g.year} ({g.type}){i < gaps.length - 1 ? ',' : '.'}
                            </span>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Timeline Overview</TabsTrigger>
                    <TabsTrigger value="academic">Academic Grid</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance Log</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior Log</TabsTrigger>
                </TabsList>

                {/* 1. Timeline Chart */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance vs. Behavior</CardTitle>
                            <CardDescription>Correlating attendance drops with behavioral spikes.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 100]} label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}/>
                                    <YAxis yAxisId="right" orientation="right" stroke="#ff7300" label={{ value: 'Incidents', angle: 90, position: 'insideRight' }}/>
                                    <Tooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} name="Attendance %" />
                                    <Bar yAxisId="right" dataKey="incidents" fill="#ff7300" barSize={40} name="Incidents" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. Academic Grid */}
                <TabsContent value="academic">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Academic Records</CardTitle>
                                <CardDescription>Past grades and standardized scores.</CardDescription>
                            </div>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Grade</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Term</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Source</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.academic.map((rec, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{rec.academicYear}</TableCell>
                                            <TableCell>{rec.term}</TableCell>
                                            <TableCell>{rec.subject}</TableCell>
                                            <TableCell className="font-bold">{rec.grade}</TableCell>
                                            <TableCell><Badge variant="outline">{rec.type}</Badge></TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{rec.source}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. Attendance Log */}
                <TabsContent value="attendance">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Attendance History</CardTitle>
                                <CardDescription>Yearly summaries.</CardDescription>
                            </div>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Year</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Absent</TableHead>
                                        <TableHead>Unauth</TableHead>
                                        <TableHead>%</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.attendance.map((rec, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{rec.academicYear}</TableCell>
                                            <TableCell>{rec.daysPresent}</TableCell>
                                            <TableCell>{rec.daysAbsent}</TableCell>
                                            <TableCell className="text-red-500">{rec.unauthorizedAbsences}</TableCell>
                                            <TableCell>
                                                <Badge className={rec.attendancePercentage < 90 ? 'bg-red-500' : 'bg-green-500'}>
                                                    {rec.attendancePercentage}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. Behavior Log */}
                <TabsContent value="behavior">
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Behavior Incidents</CardTitle>
                                <CardDescription>Disciplinary record.</CardDescription>
                            </div>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Incident</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Outcome</TableHead>
                                        <TableHead>Severity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.behavior.map((rec, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{rec.date}</TableCell>
                                            <TableCell>{rec.type}</TableCell>
                                            <TableCell className="max-w-xs truncate">{rec.description}</TableCell>
                                            <TableCell>{rec.outcome}</TableCell>
                                            <TableCell>
                                                <Badge variant={rec.severity === 'critical' ? 'destructive' : 'secondary'}>
                                                    {rec.severity}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
