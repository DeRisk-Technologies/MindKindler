// src/app/dashboard/admin/verification/page.tsx

"use client";

import React, { useState } from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { StaffProfile } from '@/types/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, ExternalLink, XCircle, Undo2 } from 'lucide-react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function VerificationQueuePage() {
    const { toast } = useToast();
    const { data: users, loading, refresh } = useFirestoreCollection<StaffProfile>('users'); 

    // Filters
    const practitioners = users.filter(u => u.role === 'EPP' || u.role === 'EducationalPsychologist');
    
    const pending = practitioners.filter(u => {
        const s = u.verification?.status;
        return !s || s === 'pending' || s === 'unverified';
    });
    
    const verified = practitioners.filter(u => u.verification?.status === 'verified');
    const rejected = practitioners.filter(u => u.verification?.status === 'rejected');

    const updateStatus = async (userId: string, status: 'verified' | 'rejected' | 'pending') => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                verification: {
                    status: status,
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: auth.currentUser?.uid,
                    hcpcNumber: 'MANUAL_OVERRIDE' 
                }
            });
            toast({ title: `Practitioner ${status}`, description: "Status updated." });
            refresh();
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const VerificationTable = ({ list, showActions = true }: { list: StaffProfile[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>HCPC Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {list.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
                )}
                {list.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName || 'New'} {user.lastName || 'User'}</TableCell>
                        <TableCell className="font-mono">{user.verification?.hcpcNumber || 'Not Provided'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={user.verification?.status === 'verified' ? 'outline' : 'secondary'} className="capitalize border-green-200">
                                {user.verification?.status || 'New'}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                            {showActions && (
                                <>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.hcpc-uk.org/check-the-register/`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-3 w-3"/> Check
                                        </a>
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(user.id, 'verified')}>
                                        <CheckCircle className="mr-2 h-3 w-3"/> Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(user.id, 'rejected')}>
                                        <XCircle className="h-4 w-4"/>
                                    </Button>
                                </>
                            )}
                            {!showActions && user.verification?.status === 'verified' && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(user.id, 'pending')}>
                                    <Undo2 className="mr-2 h-3 w-3"/> Revoke
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    if (loading) return <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Trust & Safety Queue</h1>
                <p className="text-muted-foreground">Verify HCPC registration for Educational Psychologists.</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                    <TabsTrigger value="verified">Verified Workforce ({verified.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Pending Approval</CardTitle><CardDescription>New sign-ups or profile updates requiring review.</CardDescription></CardHeader>
                        <CardContent><VerificationTable list={pending} /></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="verified" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Active Practitioners</CardTitle><CardDescription>Fully vetted staff with clinical access.</CardDescription></CardHeader>
                        <CardContent><VerificationTable list={verified} showActions={false} /></CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Rejected Applications</CardTitle></CardHeader>
                        <CardContent><VerificationTable list={rejected} showActions={false} /></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
