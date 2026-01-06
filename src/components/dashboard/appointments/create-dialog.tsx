// src/components/dashboard/appointments/create-dialog.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MeetingService } from '@/services/integrations/meetings/zoom-service';
import { Loader2, Video, Calendar, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Appointment } from '@/types/schema';

export function CreateAppointmentDialog({ onCreated, open, setOpen }: { onCreated?: () => void, open: boolean, setOpen: (open: boolean) => void }) {
    const { tenant, user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [type, setType] = useState<'in_person' | 'video'>('video');
    const [platform, setPlatform] = useState<'zoom' | 'teams'>('zoom');

    const handleCreate = async () => {
        if (!tenant || !user) return;
        setIsLoading(true);

        try {
            // 1. Create Appointment Record (Pending)
            const startDateTime = new Date(`${date}T${time}`);
            const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

            const appointmentData: Partial<Appointment> = {
                tenantId: tenant.id,
                hostUserId: user.uid,
                title,
                startAt: startDateTime.toISOString(),
                endAt: endDateTime.toISOString(),
                status: 'scheduled',
                type: 'consultation',
                locationType: type,
                participantIds: [], // Add participants logic later
                createdAt: new Date().toISOString(),
                createdBy: user.uid
            };

            const docRef = await addDoc(collection(db, `tenants/${tenant.id}/appointments`), appointmentData);

            // 2. Provision Video Link if needed
            if (type === 'video') {
                const meetingUrl = await MeetingService.createMeeting(docRef.id, platform);
                // Update doc is handled by Cloud Function usually, but for immediate UI feedback:
                // We trust the service or wait for the function. 
                // The service `createMeeting` waits for the function result.
            }

            toast({ title: "Appointment Scheduled", description: "Meeting link generated securely." });
            setOpen(false);
            if (onCreated) onCreated();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="Consultation with..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">Time</Label>
                        <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in_person">In Person</SelectItem>
                                <SelectItem value="video">Video Call</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'video' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Platform</Label>
                            <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="zoom">Zoom (Secure)</SelectItem>
                                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {type === 'video' && (
                        <div className="col-span-4 flex items-center gap-2 p-2 bg-blue-50 text-blue-700 text-xs rounded">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Meeting metadata will be sanitized for privacy.</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Schedule'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
