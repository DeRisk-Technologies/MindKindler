// src/app/dashboard/consultations/new/page.tsx

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Causing Recursion Error
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb, db } from '@/lib/firebase';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';

export default function NewConsultationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { shardId } = usePermissions();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch potential participants (Students)
    const { data: students, loading: loadingStudents } = useFirestoreCollection('students', 'lastName', 'asc');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const studentId = formData.get('studentId') as string;
        const student = students.find(s => s.id === studentId);

        const data = {
            practitionerId: user.uid,
            practitionerName: user.displayName || 'Unknown Practitioner',
            tenantId: user.tenantId,
            
            participantId: studentId,
            participantName: student ? `${student.firstName} ${student.lastName}` : formData.get('participantName'),
            participantType: 'student', // simplified for MVP

            type: formData.get('type'),
            scheduledAt: formData.get('scheduledAt'), // ISO string from datetime-local
            durationMinutes: parseInt(formData.get('duration') as string),
            location: formData.get('location'),
            
            agenda: formData.get('agenda'),
            status: 'scheduled',
            
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
            await addDoc(collection(targetDb, 'consultation_sessions'), data);
            
            toast({ title: "Session Scheduled", description: "Consultation added to calendar." });
            router.push('/dashboard/consultations');
        } catch (err: any) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule Consultation</h1>
                <p className="text-muted-foreground">Book a new session with a student, parent, or staff member.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Session Details</CardTitle>
                        <CardDescription>Enter the logistics for this appointment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Participant (Student)</Label>
                                <select name="studentId" required className={selectClass} defaultValue="">
                                    <option value="" disabled>
                                        {loadingStudents ? "Loading..." : "Select Student"}
                                    </option>
                                    {students.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.firstName} {s.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Consultation Type</Label>
                                <select name="type" defaultValue="assessment" className={selectClass}>
                                    <option value="assessment">Initial Assessment</option>
                                    <option value="review">Progress Review</option>
                                    <option value="observation">Classroom Observation</option>
                                    <option value="parent_meeting">Parent Meeting</option>
                                    <option value="staff_consultation">Staff Consultation</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Date & Time</Label>
                                <Input type="datetime-local" name="scheduledAt" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (Minutes)</Label>
                                <select name="duration" defaultValue="60" className={selectClass}>
                                    <option value="30">30 Mins</option>
                                    <option value="45">45 Mins</option>
                                    <option value="60">1 Hour</option>
                                    <option value="90">1.5 Hours</option>
                                    <option value="120">2 Hours</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input name="location" placeholder="e.g. School Office / Remote" defaultValue="School Visit" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Agenda / Key Focus</Label>
                            <Textarea name="agenda" placeholder="Primary concerns to address..." className="min-h-[100px]" />
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Schedule Session
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
