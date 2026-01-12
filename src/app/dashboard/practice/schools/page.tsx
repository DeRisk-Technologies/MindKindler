// src/app/dashboard/practice/schools/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building, MapPin, Phone, Mail, Loader2, Landmark, Pencil, Trash2 } from 'lucide-react';
// import { useFirestoreCollection } from '@/hooks/use-firestore'; // Replaced with manual fetch for query control
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, getRegionalDb } from '@/lib/firebase';
import { usePermissions } from '@/hooks/use-permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function MySchoolsPage() {
    const { user } = useAuth();
    const { shardId } = usePermissions(); 
    const { toast } = useToast();
    
    // Manual State for Data
    const [schools, setSchools] = useState<any[]>([]);
    const [leas, setLeas] = useState<any[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [loadingLeas, setLoadingLeas] = useState(true);

    // Dialog State
    const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
    const [isLeaDialogOpen, setIsLeaDialogOpen] = useState(false);
    const [editingLeaId, setEditingLeaId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // FETCH DATA (Manual to handle managedByTenantId query pattern)
    useEffect(() => {
        if (!user?.tenantId) return;

        const effectiveTenantId = user.tenantId;
        const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;

        // Fetch LEAs
        // We query by 'managedByTenantId' OR 'tenantId' to cover both legacy/seeded and new data
        // However, Firestore OR requires composite indexes. Let's try 'managedByTenantId' primarily as user indicated.
        const qLeas = query(
            collection(targetDb, 'leas'), 
            where('managedByTenantId', '==', effectiveTenantId)
            // Note: If you want to support 'tenantId' too, we'd need a separate query or an OR query (Client-side merge)
        );

        const unsubLeas = onSnapshot(qLeas, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLeas(items);
            setLoadingLeas(false);
        }, (err) => {
            console.error("LEA Fetch Error", err);
            // Fallback: Try fetching by 'tenantId' if first fails or yields empty? 
            // For now, let's assume managedByTenantId is the key as per user report.
            setLoadingLeas(false);
        });

        // Fetch Schools
        const qSchools = query(
            collection(targetDb, 'schools'),
            where('managedByTenantId', '==', effectiveTenantId)
        );

        const unsubSchools = onSnapshot(qSchools, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSchools(items);
            setLoadingSchools(false);
        }, (err) => {
            console.error("School Fetch Error", err);
            setLoadingSchools(false);
        });

        return () => {
            unsubLeas();
            unsubSchools();
        };
    }, [user, shardId]);

    const handleSaveLea = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const effectiveTenantId = user?.tenantId; 
        if (!effectiveTenantId) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            region: formData.get('region'),
            contactPerson: formData.get('contactPerson'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            notes: formData.get('notes'),
            updatedAt: serverTimestamp()
        };

        try {
            const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
            
            if (editingLeaId) {
                await updateDoc(doc(targetDb, 'leas', editingLeaId), data);
                toast({ title: "Updated", description: "LEA details updated." });
            } else {
                await addDoc(collection(targetDb, 'leas'), {
                    ...data,
                    managedByTenantId: effectiveTenantId, // Consistency with query
                    tenantId: effectiveTenantId,          // Forward compatibility
                    createdAt: serverTimestamp()
                });
                toast({ title: "Created", description: "LEA added." });
            }
            
            setIsLeaDialogOpen(false);
            setEditingLeaId(null);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveSchool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const effectiveTenantId = user?.tenantId;
        if (!effectiveTenantId) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            leaId: formData.get('leaId') || null, 
            address: formData.get('address'),
            contactEmail: formData.get('email'),
            contactPhone: formData.get('phone'),
            principalName: formData.get('principalName'),
            schoolType: formData.get('schoolType'),
            registrationNumber: formData.get('registrationNumber'),
            website: formData.get('website'),
            notes: formData.get('notes'),
            updatedAt: serverTimestamp()
        };

        try {
            const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
            
            if (editingSchoolId) {
                await updateDoc(doc(targetDb, 'schools', editingSchoolId), data);
                toast({ title: "Updated", description: "School details updated." });
            } else {
                await addDoc(collection(targetDb, 'schools'), {
                    ...data,
                    managedByTenantId: effectiveTenantId, // Consistency with query
                    tenantId: effectiveTenantId,          // Forward compatibility
                    createdAt: serverTimestamp()
                });
                toast({ title: "Created", description: "School added." });
            }
            
            setIsSchoolDialogOpen(false);
            setEditingSchoolId(null);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditLea = (lea: any) => { setEditingLeaId(lea.id); setIsLeaDialogOpen(true); };
    const handleEditSchool = (school: any) => { setEditingSchoolId(school.id); setIsSchoolDialogOpen(true); };
    const getLea = (id: string | null) => leas.find(l => l.id === id);
    const getSchool = (id: string | null) => schools.find(s => s.id === id);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
                    <p className="text-muted-foreground">Manage LEAs, Districts, and Schools you support.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditingLeaId(null); setIsLeaDialogOpen(true); }}>
                        <Landmark className="mr-2 h-4 w-4" /> Add LEA / District
                    </Button>
                    <Button onClick={() => { setEditingSchoolId(null); setIsSchoolDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add School
                    </Button>
                </div>
            </div>

            {/* LEA Dialog */}
            <Dialog open={isLeaDialogOpen} onOpenChange={(open) => { setIsLeaDialogOpen(open); if(!open) setEditingLeaId(null); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingLeaId ? "Edit LEA" : "Add LEA / District"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSaveLea} className="space-y-4">
                         <div className="space-y-2"><Label>Authority Name</Label><Input name="name" required defaultValue={editingLeaId ? getLea(editingLeaId)?.name : ""} /></div>
                        <div className="space-y-2"><Label>Region / State</Label><Input name="region" defaultValue={editingLeaId ? getLea(editingLeaId)?.region : ""} /></div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Contact Person</Label><Input name="contactPerson" defaultValue={editingLeaId ? getLea(editingLeaId)?.contactPerson : ""} /></div>
                             <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={editingLeaId ? getLea(editingLeaId)?.phone : ""} /></div>
                        </div>
                        <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={editingLeaId ? getLea(editingLeaId)?.email : ""} /></div>
                         <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" defaultValue={editingLeaId ? getLea(editingLeaId)?.notes : ""} /></div>
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save LEA</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* School Dialog */}
            <Dialog open={isSchoolDialogOpen} onOpenChange={(open) => { setIsSchoolDialogOpen(open); if(!open) setEditingSchoolId(null); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingSchoolId ? "Edit School" : "Add School"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSaveSchool} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>School Name</Label><Input name="name" required defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.name : ""} /></div>
                             <div className="space-y-2"><Label>LEA / District</Label>
                                <Select name="leaId" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.leaId : "none"}>
                                    <SelectTrigger><SelectValue placeholder="Select LEA" /></SelectTrigger>
                                    <SelectContent><SelectItem value="none">None / Independent</SelectItem>{leas.map((lea: any) => (<SelectItem key={lea.id} value={lea.id}>{lea.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label>Registration Number</Label><Input name="registrationNumber" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.registrationNumber : ""} /></div>
                            <div className="space-y-2"><Label>School Type</Label>
                                <Select name="schoolType" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.schoolType : "primary"}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="primary">Primary / Elementary</SelectItem><SelectItem value="secondary">Secondary / High School</SelectItem><SelectItem value="special">Special / SEND</SelectItem><SelectItem value="independent">Independent / Private</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.address : ""} /></div>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2"><Label>Principal</Label><Input name="principalName" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.principalName : ""} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.contactEmail : ""} /></div>
                            <div className="space-y-2"><Label>Phone</Label><Input name="phone" type="tel" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.contactPhone : ""} /></div>
                        </div>
                         <div className="space-y-2"><Label>Website</Label><Input name="website" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.website : ""} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" defaultValue={editingSchoolId ? getSchool(editingSchoolId)?.notes : ""} /></div>
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save School</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* List Views */}
             {leas.length > 0 && (
                <Card><CardHeader><CardTitle>Authorities & Districts</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>{leas.map((lea: any) => (
                                    <TableRow key={lea.id}><TableCell className="font-medium flex items-center gap-2"><Landmark className="h-4 w-4 text-indigo-500" />{lea.name}</TableCell><TableCell>{lea.region}</TableCell><TableCell><div className="flex flex-col text-xs"><span>{lea.contactPerson}</span><span className="text-muted-foreground">{lea.email}</span></div></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEditLea(lea)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
                                ))}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
             )}

            <Card>
                <CardHeader><CardTitle>Schools Caseload ({schools.length})</CardTitle><CardDescription>Schools assigned to your practice.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>LEA</TableHead><TableHead>Address</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loadingSchools && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                            {!loadingSchools && schools.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schools found.</TableCell></TableRow>}
                            {schools.map((school: any) => (
                                <TableRow key={school.id}>
                                    <TableCell className="font-medium flex items-center gap-2"><Building className="h-4 w-4 text-slate-500" />{school.name}</TableCell>
                                     <TableCell><span className="capitalize text-xs bg-slate-100 px-2 py-1 rounded">{school.schoolType || "N/A"}</span></TableCell>
                                     <TableCell>{leas.find((l:any) => l.id === school.leaId)?.name || "-"}</TableCell>
                                    <TableCell><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {school.address || "N/A"}</div></TableCell>
                                    <TableCell><div className="flex flex-col text-xs">{school.contactEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {school.contactEmail}</span>}{school.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {school.contactPhone}</span>}</div></TableCell>
                                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEditSchool(school)}><Pencil className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
