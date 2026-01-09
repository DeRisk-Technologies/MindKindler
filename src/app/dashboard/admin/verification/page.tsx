// src/app/dashboard/admin/verification/page.tsx

"use client";

import React from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { StaffProfile } from '@/types/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth, getRegionalDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function VerificationQueuePage() {
    const { toast } = useToast();
    const { data: users, loading, refresh } = useFirestoreCollection<StaffProfile>('users'); 

    const practitioners = users.filter(u => 
        u.role === 'EPP' || u.role === 'educationalpsychologist' || u.role === 'EducationalPsychologist'
    );
    
    const pending = practitioners.filter(u => u.verification?.status !== 'verified' && u.verification?.status !== 'rejected');
    const verified = practitioners.filter(u => u.verification?.status === 'verified');

    const handleApprove = async (user: StaffProfile) => {
        try {
            // Determine target DB based on user's region
            const targetDb = user.region ? getRegionalDb(user.region) : db;
            
            // SECURITY: Update specific fields using dot notation to preserve HCPC number
            await updateDoc(doc(targetDb, 'users', user.id), {
                'verification.status': 'verified',
                'verification.verifiedAt': new Date().toISOString(),
                'verification.verifiedBy': auth.currentUser?.uid,
                // Ensure status is also updated in Global Router for fast-path checks
                'status': 'verified' 
            });

            toast({ title: "Practitioner Verified", description: `${user.firstName} now has clinical access.` });
            refresh();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Approval Failed", description: e.message });
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clinical Verification Queue</h1>
                <p className="text-muted-foreground">Manage HCPC registration for Educational Psychologists.</p>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending Review ({pending.length})</TabsTrigger>
                    <TabsTrigger value="verified">Verified Workforce</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>HCPC Number</TableHead>
                                        <TableHead>Region</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pending.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                                            <TableCell className="font-mono text-xs">{u.verification?.hcpcNumber || u.extensions?.registration_number || 'Pending Input'}</TableCell>
                                            <TableCell><Badge variant="outline">{u.region?.toUpperCase()}</Badge></TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href="https://www.hcpc-uk.org/check-the-register/" target="_blank">Check HCPC</a>
                                                </Button>
                                                <Button size="sm" className="bg-green-600" onClick={() => handleApprove(u)}>Approve</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="verified">
                    {/* ... list verified ... */}
                </TabsContent>
            </Tabs>
        </div>
    );
}
