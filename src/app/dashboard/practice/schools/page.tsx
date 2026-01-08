// src/app/dashboard/practice/schools/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building, MapPin, Phone, Mail, Loader2, Landmark } from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, getRegionalDb } from '@/lib/firebase';
import { usePermissions } from '@/hooks/use-permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function MySchoolsPage() {
    const { user } = useAuth();
    const { shardId } = usePermissions(); // Get Region
    const { toast } = useToast();
    
    // Fetch Schools from Regional Shard
    const { data: schools, loading: loadingSchools, refresh: refreshSchools } = useFirestoreCollection('schools');
    
    // Fetch LEAs (Organizations) - Assume they are stored in 'organizations' collection in Shard for EPP view, 
    // or maybe global? For now let's assume EPPs create 'Client Organizations' in their shard.
    // Actually, based on previous convo, Organizations are global but EPPs might want to model LEAs as just metadata or "Client Groups".
    // Let's create a 'clients' collection in the regional shard for LEAs/Districts managed by EPP.
    const { data: leas, loading: loadingLeas, refresh: refreshLeas } = useFirestoreCollection('leas');

    const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
    const [isLeaDialogOpen, setIsLeaDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSchool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            leaId: formData.get('leaId') || null, // Link to LEA
            address: formData.get('address'),
            contactEmail: formData.get('email'),
            contactPhone: formData.get('phone'),
            principalName: formData.get('principalName'),
            schoolType: formData.get('schoolType'),
            registrationNumber: formData.get('registrationNumber'),
            website: formData.get('website'),
            notes: formData.get('notes'),
            managedByTenantId: (user as any).tenantId,
            createdAt: serverTimestamp()
        };

        try {
            const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
            await addDoc(collection(targetDb, 'schools'), data);
            
            toast({ title: "School Added", description: "Added to your client list." });
            setIsSchoolDialogOpen(false);
            refreshSchools();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddLea = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            region: formData.get('region'),
            contactPerson: formData.get('contactPerson'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            notes: formData.get('notes'),
            managedByTenantId: (user as any).tenantId,
            createdAt: serverTimestamp()
        };

        try {
            const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
            await addDoc(collection(targetDb, 'leas'), data);
            
            toast({ title: "LEA / District Added", description: "Added to your client list." });
            setIsLeaDialogOpen(false);
            refreshLeas();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
                    <p className="text-muted-foreground">Manage LEAs, Districts, and Schools you support.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsLeaDialogOpen(true)}>
                        <Landmark className="mr-2 h-4 w-4" /> Add LEA / District
                    </Button>
                    <Button onClick={() => setIsSchoolDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add School
                    </Button>
                </div>
            </div>

            {/* LEA Dialog */}
            <Dialog open={isLeaDialogOpen} onOpenChange={setIsLeaDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Local Authority / District</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddLea} className="space-y-4">
                         <div className="space-y-2">
                            <Label>Authority Name</Label>
                            <Input name="name" required placeholder="e.g. Hampshire County Council" />
                        </div>
                        <div className="space-y-2">
                            <Label>Region / State</Label>
                            <Input name="region" placeholder="e.g. South East" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input name="contactPerson" placeholder="Lead Psychologist" />
                            </div>
                             <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input name="phone" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" />
                        </div>
                         <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea name="notes" placeholder="Contract details, SLA..." />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save LEA
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* School Dialog */}
            <Dialog open={isSchoolDialogOpen} onOpenChange={setIsSchoolDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Client School</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSchool} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>School Name</Label>
                                <Input name="name" required placeholder="e.g. Springfield Elementary" />
                            </div>
                             <div className="space-y-2">
                                <Label>LEA / District</Label>
                                <Select name="leaId">
                                    <SelectTrigger><SelectValue placeholder="Select LEA (Optional)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None / Independent</SelectItem>
                                        {leas.map((lea: any) => (
                                            <SelectItem key={lea.id} value={lea.id}>{lea.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Registration Number (URN/NCES)</Label>
                                <Input name="registrationNumber" placeholder="123456" />
                            </div>
                            <div className="space-y-2">
                                <Label>School Type</Label>
                                <Select name="schoolType">
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="primary">Primary / Elementary</SelectItem>
                                        <SelectItem value="secondary">Secondary / High School</SelectItem>
                                        <SelectItem value="special">Special / SEND</SelectItem>
                                        <SelectItem value="independent">Independent / Private</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input name="address" placeholder="Full Address" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label>Principal / Head</Label>
                                <Input name="principalName" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input name="phone" type="tel" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Website</Label>
                            <Input name="website" placeholder="https://" />
                        </div>
                        <div className="space-y-2">
                            <Label>Internal Notes</Label>
                            <Textarea name="notes" placeholder="Access details, parking, key contacts..." />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save School
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* LEA List */}
             {leas.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Authorities & Districts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Schools</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leas.map((lea: any) => (
                                    <TableRow key={lea.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Landmark className="h-4 w-4 text-indigo-500" />
                                            {lea.name}
                                        </TableCell>
                                        <TableCell>{lea.region}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                 <span>{lea.contactPerson}</span>
                                                 <span className="text-muted-foreground">{lea.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {schools.filter((s:any) => s.leaId === lea.id).length}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             )}

            {/* School List */}
            <Card>
                <CardHeader>
                    <CardTitle>Schools Caseload ({schools.length})</CardTitle>
                    <CardDescription>Schools assigned to your practice.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>LEA</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Contact</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingSchools && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loadingSchools && schools.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No schools found. Add your first client.</TableCell></TableRow>
                            )}
                            {schools.map((school: any) => (
                                <TableRow key={school.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Building className="h-4 w-4 text-slate-500" />
                                        {school.name}
                                    </TableCell>
                                     <TableCell>
                                         <span className="capitalize text-xs bg-slate-100 px-2 py-1 rounded">{school.schoolType || "N/A"}</span>
                                     </TableCell>
                                     <TableCell>
                                         {leas.find((l:any) => l.id === school.leaId)?.name || "-"}
                                     </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {school.address || "N/A"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            {school.contactEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {school.contactEmail}</span>}
                                            {school.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {school.contactPhone}</span>}
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
