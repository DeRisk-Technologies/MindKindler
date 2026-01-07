// src/components/dashboard/widgets/ComplianceWidget.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ComplianceWidget() {
    // In prod: Fetch real stats from WorkflowEngine / Aggregation
    const stats = {
        dbsExpiring: 2, // Amber
        unexplainedAbsences: 1, // Red
        scrCompliant: 98 // Green %
    };

    return (
        <Card className="border-l-4 border-l-amber-500 shadow-sm h-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        Statutory Compliance
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase">EYFS 2025</Badge>
                </div>
                <CardDescription>Live monitoring of legal duties.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Critical Item */}
                    {stats.unexplainedAbsences > 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">{stats.unexplainedAbsences} Unexplained Absence</h4>
                                <p className="text-xs text-red-700">First Day Calling protocol triggered.</p>
                                <Button variant="link" className="h-auto p-0 text-red-800 text-xs mt-1 font-semibold" asChild>
                                    <Link href="/dashboard/cases">Review Case &rarr;</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" /> No Unexplained Absences
                        </div>
                    )}

                    {/* Warning Item */}
                    {stats.dbsExpiring > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-3">
                            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm">{stats.dbsExpiring} DBS Checks Expiring</h4>
                                <p className="text-xs text-amber-700">Staff vetting renewal required &lt;90 days.</p>
                                <Button variant="link" className="h-auto p-0 text-amber-800 text-xs mt-1 font-semibold" asChild>
                                    <Link href="/dashboard/staff">Open SCR &rarr;</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
