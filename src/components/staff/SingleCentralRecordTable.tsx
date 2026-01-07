// src/components/staff/SingleCentralRecordTable.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { Loader2, ShieldAlert, CheckCircle, FileWarning } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export function SingleCentralRecordTable() {
    const { config: schemaConfig, loading: loadingExtensions } = useSchemaExtensions();
    // In a real app, this would fetch 'users' where role is staff/teacher
    // Mocking the hook call for demonstration
    const { data: staffMembers, loading: loadingStaff } = useFirestoreCollection('users', 'createdAt', 'desc');

    const isLoading = loadingExtensions || loadingStaff;

    // Filter to find relevant columns for SCR (DBS, Prohibition, etc.)
    // We assume any 'staff' extension field is part of the SCR.
    const scrColumns = schemaConfig.staffFields || [];

    // Mock compliance check logic (would typically be shared with WorkflowEngine)
    const getComplianceStatus = (staff: any, fieldName: string) => {
        const val = staff.extensions?.[fieldName];
        
        // Example: DBS Date Check
        if (fieldName === 'scr_dbs_issue_date' && val) {
            const issueDate = parseISO(val);
            const renewalDate = new Date(issueDate);
            renewalDate.setFullYear(renewalDate.getFullYear() + 3); // 3 Year Rule
            
            const daysLeft = differenceInDays(renewalDate, new Date());
            
            if (daysLeft < 0) return { status: 'expired', label: 'EXPIRED' };
            if (daysLeft < 90) return { status: 'warning', label: `Exp in ${daysLeft}d` };
            return { status: 'valid', label: 'Valid' };
        }

        // Boolean Checks (e.g. Right to Work)
        if (typeof val === 'boolean') {
            return val ? { status: 'valid', label: 'Yes' } : { status: 'error', label: 'Missing' };
        }

        return { status: 'neutral', label: val || '-' };
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-600" />
                            Single Central Record (SCR)
                        </CardTitle>
                        <CardDescription>Statutory vetting register for all staff (KCSIE 2025 Compliance).</CardDescription>
                    </div>
                    {/* Export button would go here */}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Staff Name</TableHead>
                            <TableHead>Role</TableHead>
                            {/* Dynamic SCR Columns */}
                            {scrColumns.map(col => (
                                <TableHead key={col.fieldName} className="whitespace-nowrap">
                                    {col.label}
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Compliance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={3 + scrColumns.length} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin inline" />
                                </TableCell>
                            </TableRow>
                        )}
                        
                        {!isLoading && staffMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3 + scrColumns.length} className="text-center py-8 text-muted-foreground">
                                    No staff records found.
                                </TableCell>
                            </TableRow>
                        )}

                        {staffMembers.map((staff: any) => {
                            // Calculate aggregate status
                            let hasError = false;
                            let hasWarning = false;

                            return (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium">
                                        {staff.displayName || `${staff.firstName} ${staff.lastName}`}
                                    </TableCell>
                                    <TableCell>{staff.role || 'Staff'}</TableCell>
                                    
                                    {/* Dynamic Cells */}
                                    {scrColumns.map(col => {
                                        const { status, label } = getComplianceStatus(staff, col.fieldName);
                                        if (status === 'error' || status === 'expired') hasError = true;
                                        if (status === 'warning') hasWarning = true;

                                        return (
                                            <TableCell key={col.fieldName}>
                                                {status === 'valid' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> {label}</span>}
                                                {status === 'warning' && <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded text-xs">{label}</span>}
                                                {(status === 'error' || status === 'expired') && <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs">{label}</span>}
                                                {status === 'neutral' && <span className="text-muted-foreground">{label}</span>}
                                            </TableCell>
                                        );
                                    })}

                                    <TableCell className="text-right">
                                        {hasError ? (
                                            <Badge variant="destructive">Non-Compliant</Badge>
                                        ) : hasWarning ? (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Review</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliant</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
