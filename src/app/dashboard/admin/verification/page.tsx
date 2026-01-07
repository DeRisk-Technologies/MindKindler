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
import { Loader2, CheckCircle, ExternalLink, XCircle, Undo2, Globe } from 'lucide-react';
import { updateDoc, doc, serverTimestamp, Firestore } from 'firebase/firestore';
import { db, auth, getRegionalDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Available Shards for Global Super Admin View
const AVAILABLE_SHARDS = [
    { id: 'mindkindler-uk', name: 'UK Shard', region: 'uk' },
    { id: 'mindkindler-us', name: 'US Shard', region: 'us' },
    { id: 'mindkindler-eu', name: 'EU Shard', region: 'eu' },
    { id: 'mindkindler-asia', name: 'Asia Shard', region: 'asia' },
    { id: 'mindkindler-me', name: 'Middle East Shard', region: 'me' }
];

export default function VerificationQueuePage() {
    const { toast } = useToast();
    const { shardId: myShardId, hasRole } = usePermissions();
    const isGlobalSuperAdmin = hasRole(['SuperAdmin']) && (!myShardId || myShardId === 'default');
    
    // State to control which shard we are viewing
    // If Global SuperAdmin, default to UK (or allow select). 
    // If Regional Admin, force to myShardId.
    const [viewShard, setViewShard] = useState<string>(
        (myShardId && myShardId !== 'default') ? myShardId : 'mindkindler-uk'
    );

    // Fetch users from the selected Shard
    const { data: users, loading, refresh } = useFirestoreCollection<StaffProfile>(
        'users', 
        'createdAt', 
        'desc',
        { targetShard: viewShard }
    ); 

    // Filters
    // Make filter case-insensitive for robustness
    const practitioners = users.filter(u => {
        const role = u.role?.toLowerCase();
        return role === 'epp' || role === 'educationalpsychologist' || role === 'schooladmin' || role === 'clinicalpsychologist' || role === 'teacher';
    });
    
    const pending = practitioners.filter(u => {
        const s = u.verification?.status;
        return !s || s === 'pending' || s === 'unverified';
    });
    
    const verified = practitioners.filter(u => u.verification?.status === 'verified');
    const rejected = practitioners.filter(u => u.verification?.status === 'rejected');

    const updateStatus = async (userId: string, status: 'verified' | 'rejected' | 'pending') => {
        try {
            // Determine Target DB for Write
            let targetDb: Firestore = db;
            if (viewShard !== 'default') {
                const region = viewShard.replace('mindkindler-', '');
                targetDb = getRegionalDb(region);
            }

            await updateDoc(doc(targetDb, 'users', userId), {
                verification: {
                    status: status,
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: auth.currentUser?.uid,
                    hcpcNumber: 'MANUAL_OVERRIDE' // Ideally preserve existing if present
                }
            });
            toast({ title: `Practitioner ${status}`, description: "Status updated in Regional Registry." });
            refresh();
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", variant: "destructive", description: e.message });
        }
    };

    const VerificationTable = ({ list, showActions = true }: { list: StaffProfile[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {list.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found in {viewShard}.</TableCell></TableRow>
                )}
                {list.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName || 'New'} {user.lastName || 'User'}</TableCell>
                        <TableCell className="font-mono">{user.verification?.hcpcNumber || user.extensions?.registration_number || 'N/A'}</TableCell>
                         <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
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
                                            <ExternalLink className="mr-2 h-3 w-3"/> Verify
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

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Trust & Safety Queue</h1>
                    <p className="text-muted-foreground">Verify HCPC/Registration for Educational Psychologists & Schools.</p>
                </div>
                
                {/* Shard Selector for Global Admins */}
                {isGlobalSuperAdmin && (
                     <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                        <Globe className="h-4 w-4 ml-2 text-muted-foreground" />
                        <Select value={viewShard} onValueChange={setViewShard}>
                            <SelectTrigger className="border-0 bg-transparent shadow-none w-[180px] h-8 text-xs font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_SHARDS.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {/* Regional Admin Badge */}
                {!isGlobalSuperAdmin && (
                    <Badge variant="outline" className="h-8 gap-2">
                        <Globe className="h-3 w-3" />
                        Region: {viewShard.replace('mindkindler-', '').toUpperCase()}
                    </Badge>
                )}
            </div>

            {loading ? (
                 <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>
            ) : (
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList>
                        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                        <TabsTrigger value="verified">Verified Workforce ({verified.length})</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Pending Approval</CardTitle><CardDescription>New sign-ups requiring regulator check.</CardDescription></CardHeader>
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
            )}
        </div>
    );
}
