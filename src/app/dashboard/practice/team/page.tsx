// src/app/dashboard/practice/team/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Loader2, ShieldCheck, Mail, Phone, Briefcase } from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { StaffService } from '@/services/staff-service';
import { usePermissions } from '@/hooks/use-permissions';
import { Textarea } from "@/components/ui/textarea";

export default function PracticeTeamPage() {
    const { user } = useAuth();
    const { shardId } = usePermissions();
    const { toast } = useToast();
    
    // Fetch Staff from the Tenant's Subcollection (Regional Shard)
    const tenantId = (user as any)?.tenantId;
    const { data: team, loading, refresh } = useFirestoreCollection(
        tenantId ? `tenants/${tenantId}/staff` : 'null_collection'
    );
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!tenantId || !shardId) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const role = formData.get('role') as string;
        
        try {
            await StaffService.createStaffMember(tenantId, shardId.replace('mindkindler-', ''), {
                tenantId,
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                role: role,
                status: 'active',
                extensions: {
                    phone: formData.get('phone'),
                    jobTitle: formData.get('jobTitle'),
                    qualifications: formData.get('qualifications'),
                    hcpcNumber: formData.get('hcpcNumber'), // UK Specific
                    dbsNumber: formData.get('dbsNumber'), // UK Specific
                    bio: formData.get('bio')
                }
            });
            
            toast({ title: "Team Member Added", description: `${role} added to your practice.` });
            setIsDialogOpen(false);
            refresh();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tenantId) return <div className="p-8">Loading Practice Context...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Practice Team</h1>
                    <p className="text-muted-foreground">Manage your clinical and administrative staff.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input name="firstName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input name="lastName" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input name="phone" type="tel" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select name="role" defaultValue="Associate EPP">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Associate EPP">Associate EPP</SelectItem>
                                            <SelectItem value="Assistant">Assistant Psychologist</SelectItem>
                                            <SelectItem value="Admin">Practice Manager</SelectItem>
                                            <SelectItem value="Trainee">Trainee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Title</Label>
                                    <Input name="jobTitle" placeholder="e.g. Senior Psychologist" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 rounded-md space-y-4 border">
                                <h3 className="text-sm font-semibold text-slate-800">Compliance & Credentials</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>HCPC / License Number</Label>
                                        <Input name="hcpcNumber" placeholder="PYL12345" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>DBS / Background Check</Label>
                                        <Input name="dbsNumber" placeholder="00123456789" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Qualifications</Label>
                                    <Input name="qualifications" placeholder="DEdPsy, CPsychol..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Professional Bio</Label>
                                <Textarea name="bio" placeholder="Short biography for reports..." />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Add Member
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Directory ({team.length})</CardTitle>
                    <CardDescription>Users with access to your practice data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Credentials</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loading && team.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No additional staff found.</TableCell></TableRow>
                            )}
                            {team.map((member: any) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <div>
                                            <div>{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{member.extensions?.jobTitle}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{member.role}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs gap-1">
                                            {member.extensions?.hcpcNumber && <span className="bg-blue-50 text-blue-700 px-1 rounded w-fit">HCPC: {member.extensions.hcpcNumber}</span>}
                                            {member.extensions?.dbsNumber && <span className="bg-green-50 text-green-700 px-1 rounded w-fit">DBS Checked</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground gap-1">
                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>
                                            {member.extensions?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.extensions.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2 text-green-600 text-xs font-medium">
                                            <ShieldCheck className="h-3 w-3" /> Active
                                        </div>
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
