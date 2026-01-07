// src/app/dashboard/admin/verification/page.tsx

"use client";

import React from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { StaffProfile } from '@/types/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function VerificationQueuePage() {
    const { toast } = useToast();
    // In prod: filter where role == 'EPP' and status == 'pending'
    const { data: users, loading, refresh } = useFirestoreCollection<StaffProfile>('users'); 
    
    // Filter locally for MVP demo
    const pendingVerifications = users.filter(u => 
        (u.role === 'EPP' || u.role === 'EducationalPsychologist') && 
        u.verification?.status === 'pending'
    );

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                'verification.status': 'verified',
                'verification.verifiedAt': new Date().toISOString(),
                'verification.verifiedBy': auth.currentUser?.uid
            });
            toast({ title: "Practitioner Verified", description: "Access granted to clinical tools." });
            refresh();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm("Reject this practitioner? They will lose access.")) return;
        try {
            await updateDoc(doc(db, 'users', userId), {
                'verification.status': 'rejected',
                'verification.verifiedAt': new Date().toISOString(),
                'verification.verifiedBy': auth.currentUser?.uid
            });
            toast({ title: "Practitioner Rejected" });
            refresh();
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Trust & Safety Queue</h1>
                <p className="text-muted-foreground">Verify HCPC registration for Educational Psychologists.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Verifications ({pendingVerifications.length})</CardTitle>
                    <CardDescription>Practitioners awaiting approval to practice.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>HCPC Number</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && pendingVerifications.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No pending verifications.</TableCell></TableRow>
                            )}
                            {pendingVerifications.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                    <TableCell className="font-mono">{user.verification?.hcpcNumber || 'N/A'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`https://www.hcpc-uk.org/check-the-register/`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-3 w-3"/> Check Register
                                            </a>
                                        </Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(user.id)}>
                                            <CheckCircle className="mr-2 h-3 w-3"/> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleReject(user.id)}>
                                            <XCircle className="h-4 w-4"/>
                                        </Button>
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
