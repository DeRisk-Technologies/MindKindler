// src/components/student360/dialogs/StudentEditDialog.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    onSuccess?: () => void;
}

export function StudentEditDialog({ open, onOpenChange, studentId, onSuccess }: StudentEditDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        upn: '',
        schoolId: '',
        parentId: ''
    });

    // Fetch Lists for Dropdowns
    const { data: schools } = useFirestoreCollection('schools', 'name', 'asc');
    const { data: users } = useFirestoreCollection('users', 'displayName', 'asc');
    const parents = users.filter(u => u.role === 'parent');

    // Load Student Data
    useEffect(() => {
        if (!open || !studentId || !user) return;

        async function load() {
            setLoading(true);
            try {
                const db = getRegionalDb(user?.region || 'uk');
                const ref = doc(db, 'students', studentId);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setFormData({
                        firstName: data.firstName || data.identity?.firstName?.value || '',
                        lastName: data.lastName || data.identity?.lastName?.value || '',
                        dob: data.dob || data.identity?.dateOfBirth?.value || '',
                        upn: data.upn || '',
                        schoolId: data.schoolId || data.education?.currentSchoolId?.value || '',
                        parentId: data.parentId || ''
                    });
                }
            } catch (e) {
                console.error("Failed to load student", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [open, studentId, user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const db = getRegionalDb(user.region || 'uk');
            const ref = doc(db, 'students', studentId);
            
            // Update both flat fields and deep structure for compatibility
            await updateDoc(ref, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dob: formData.dob,
                upn: formData.upn,
                schoolId: formData.schoolId,
                parentId: formData.parentId,
                
                // Deep structure sync (optional but good for consistency)
                "identity.firstName.value": formData.firstName,
                "identity.lastName.value": formData.lastName,
                "identity.dateOfBirth.value": formData.dob,
                "education.currentSchoolId.value": formData.schoolId,
                updatedAt: new Date().toISOString()
            });

            toast({ title: "Updated", description: "Student details saved." });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Student Profile</DialogTitle>
                </DialogHeader>
                
                {loading && !formData.firstName ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input 
                                    value={formData.firstName} 
                                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input 
                                    value={formData.lastName} 
                                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input 
                                    type="date"
                                    value={formData.dob} 
                                    onChange={e => setFormData({...formData, dob: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>UPN (Unique Pupil Number)</Label>
                                <Input 
                                    value={formData.upn} 
                                    onChange={e => setFormData({...formData, upn: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>School</Label>
                            <Select 
                                value={formData.schoolId} 
                                onValueChange={val => setFormData({...formData, schoolId: val})}
                            >
                                <SelectTrigger><SelectValue placeholder="Select School..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No School Linked</SelectItem>
                                    {schools.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Parent / Guardian</Label>
                            <Select 
                                value={formData.parentId} 
                                onValueChange={val => setFormData({...formData, parentId: val})}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Parent..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Parent Linked</SelectItem>
                                    {parents.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                To add a new parent, go to the Student Directory.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
