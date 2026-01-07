// src/components/staff/SingleCentralRecordTable.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { Loader2, ShieldAlert, CheckCircle, FileWarning, AlertOctagon, Clock } from 'lucide-react';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function SingleCentralRecordTable() {
    const { toast } = useToast();
    const { config: schemaConfig, loading: loadingExtensions } = useSchemaExtensions();
    const { data: staffMembers, loading: loadingStaff, refresh } = useFirestoreCollection('users', 'createdAt', 'desc');

    const isLoading = loadingExtensions || loadingStaff;
    const scrColumns = schemaConfig.staffFields || [];

    // Compliance Check with Override Logic
    const getComplianceStatus = (staff: any, fieldName: string, isRequired: boolean) => {
        const val = staff.extensions?.[fieldName];
        
        // 1. Check for Admin Override (Extension)
        const overrideDate = staff.extensions?.complianceOverrideUntil;
        const isOverridden = overrideDate && new Date(overrideDate) > new Date();

        // 2. Missing Data
        if (!val && isRequired) {
            if (isOverridden) return { status: 'warning', label: 'EXTENDED' };
            return { status: 'error', label: 'MISSING' };
        }

        // 3. Expiry Check (DBS)
        if (fieldName === 'scr_dbs_issue_date' && val) {
            const issueDate = parseISO(val);
            const renewalDate = new Date(issueDate);
            renewalDate.setFullYear(renewalDate.getFullYear() + 3); 
            
            const daysLeft = differenceInDays(renewalDate, new Date());
            
            if (daysLeft < 0) {
                 if (isOverridden) return { status: 'warning', label: 'EXTENDED' };
                 return { status: 'expired', label: 'EXPIRED' };
            }
            if (daysLeft < 90) return { status: 'warning', label: `Exp in ${daysLeft}d` };
            return { status: 'valid', label: 'Valid' };
        }

        // 4. Boolean Checks
        if (typeof val === 'boolean') {
            return val ? { status: 'valid', label: 'Yes' } : { status: 'error', label: 'No' };
        }

        return { status: 'neutral', label: val || '-' };
    };

    const handleGrantExtension = async (staffId: string) => {
        console.log("Granting extension for:", staffId);
        
        // Replaced prompt with confirm for MVP reliability
        if (!confirm("Grant a 30-day compliance extension for this staff member?")) return;
        
        const newDate = addDays(new Date(), 30);
        
        try {
            console.log("Updating document...", newDate.toISOString());
            
            // Note: We use dot notation for nested update to avoid overwriting other extension data
            await updateDoc(doc(db, 'users', staffId), {
                'extensions.complianceOverrideUntil': newDate.toISOString()
            });
            
            toast({ 
                title: "Extension Granted", 
                description: `Compliance enforced until ${format(newDate, 'PPP')}` 
            });
            
            // Force refresh of the table data
            if (refresh) refresh();
            
        } catch (e: any) {
            console.error("Extension Failed:", e);
            toast({ 
                title: "Extension Failed", 
                description: e.message || "Permission denied.",
                variant: "destructive" 
            });
        }
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
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Staff Name</TableHead>
                            <TableHead>Role</TableHead>
                            {scrColumns.map(col => (
                                <TableHead key={col.fieldName} className="whitespace-nowrap">{col.label}</TableHead>
                            ))}
                            <TableHead className="text-right">Compliance</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin inline" /></TableCell></TableRow>}
                        
                        {staffMembers.map((staff: any) => {
                            if (staff.role === 'ParentUser' || staff.role === 'Student') return null;

                            let hasError = false;
                            let hasWarning = false;

                            // Calculate Row Status
                            scrColumns.forEach(col => {
                                const { status } = getComplianceStatus(staff, col.fieldName, col.required);
                                if (status === 'error' || status === 'expired') hasError = true;
                                if (status === 'warning') hasWarning = true;
                            });

                            return (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium">
                                        {staff.displayName || `${staff.firstName || ''} ${staff.lastName || ''}` || 'Unknown'}
                                    </TableCell>
                                    <TableCell>{staff.role || 'Staff'}</TableCell>
                                    
                                    {scrColumns.map(col => {
                                        const { status, label } = getComplianceStatus(staff, col.fieldName, col.required);
                                        return (
                                            <TableCell key={col.fieldName}>
                                                {status === 'valid' && <span className="text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle className="h-3 w-3"/> {label}</span>}
                                                {status === 'warning' && <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded text-xs">{label}</span>}
                                                {(status === 'error' || status === 'expired') && <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs flex items-center gap-1"><AlertOctagon className="h-3 w-3"/>{label}</span>}
                                                {status === 'neutral' && <span className="text-muted-foreground text-xs">{label}</span>}
                                            </TableCell>
                                        );
                                    })}

                                    <TableCell className="text-right">
                                        {hasError ? <Badge variant="destructive">Non-Compliant</Badge>
                                        : hasWarning ? <Badge variant="secondary" className="bg-amber-100 text-amber-800">Review</Badge>
                                        : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliant</Badge>}
                                    </TableCell>
                                    
                                    <TableCell>
                                        {(hasError || hasWarning) && (
                                            <Button variant="ghost" size="icon" title="Grant Extension (30 Days)" onClick={() => handleGrantExtension(staff.id)}>
                                                <Clock className="h-4 w-4 text-blue-600" />
                                            </Button>
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
