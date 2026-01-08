// src/components/staff/SingleCentralRecordTable.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { Loader2, ShieldAlert, CheckCircle, AlertOctagon } from 'lucide-react';

export function SingleCentralRecordTable() {
    const { config: schemaConfig, loading: loadingExtensions } = useSchemaExtensions();
    const { data: users, loading: loadingStaff } = useFirestoreCollection('users');

    // SECURITY: The SCR is strictly for SCHOOL STAFF. Exclude EPPs/Clinicians.
    const staffMembers = users.filter(u => 
        ['teacher', 'ta', 'schooladmin', 'schooladministrator'].includes(u.role?.toLowerCase() || '')
    );

    if (loadingStaff) return <Loader2 className="animate-spin" />;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    School Staff Register (SCR)
                </CardTitle>
                <CardDescription>Statutory vetting for personnel with regular child contact.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>DBS Status</TableHead>
                            <TableHead className="text-right">Compliance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffMembers.map(staff => (
                            <TableRow key={staff.id}>
                                <TableCell className="font-medium">{staff.firstName} {staff.lastName}</TableCell>
                                <TableCell className="capitalize">{staff.role}</TableCell>
                                <TableCell>{staff.extensions?.scr_dbs_number ? 'Verified' : 'Missing'}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={staff.extensions?.scr_dbs_number ? 'outline' : 'destructive'}>
                                        {staff.extensions?.scr_dbs_number ? 'Compliant' : 'Non-Compliant'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
