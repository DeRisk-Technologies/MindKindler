"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AvailabilityProfile } from "@/types/schema";
import { Calendar, Clock, Plus, Trash, User } from "lucide-react";

// Helper for time slots
const TIME_SLOTS = Array.from({ length: 24 * 2 }).map((_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AvailabilitySettings() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<Partial<AvailabilityProfile>>({
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        workingHours: [
            { day: "Mon", start: "09:00", end: "17:00" },
            { day: "Tue", start: "09:00", end: "17:00" },
            { day: "Wed", start: "09:00", end: "17:00" },
            { day: "Thu", start: "09:00", end: "17:00" },
            { day: "Fri", start: "09:00", end: "16:00" }
        ],
        allowedChannels: ["video", "inPerson"],
        unavailableDates: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (!user) return;
            
            try {
                const docRef = doc(db, "availability_profiles", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setProfile(snap.data() as AvailabilityProfile);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await setDoc(doc(db, "availability_profiles", user.uid), {
                id: user.uid,
                ...profile,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            toast({ title: "Availability Updated", description: "Your schedule has been saved." });
        } catch (e) {
            toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
        }
    };

    const toggleDay = (day: any) => {
        const current = profile.workingDays || [];
        if (current.includes(day)) {
            setProfile({ ...profile, workingDays: current.filter(d => d !== day) });
        } else {
            setProfile({ ...profile, workingDays: [...current, day] });
        }
    };

    const updateHours = (day: string, field: 'start' | 'end', value: string) => {
        const hours = profile.workingHours || [];
        const existing = hours.find(h => h.day === day);
        
        let newHours;
        if (existing) {
            newHours = hours.map(h => h.day === day ? { ...h, [field]: value } : h);
        } else {
            newHours = [...hours, { day, start: "09:00", end: "17:00", [field]: value }];
        }
        setProfile({ ...profile, workingHours: newHours });
    };

    const getHours = (day: string) => {
        return profile.workingHours?.find(h => h.day === day) || { day, start: "09:00", end: "17:00" };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Availability & Scheduling</CardTitle>
                <CardDescription>Configure when you are available for AI-booked appointments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Working Days & Hours */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Weekly Schedule</Label>
                    <div className="grid gap-4">
                        {DAYS.map(day => {
                            const isWorking = profile.workingDays?.includes(day as any);
                            const hours = getHours(day);

                            return (
                                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-2 w-24">
                                        <Checkbox 
                                            checked={isWorking} 
                                            onCheckedChange={() => toggleDay(day)} 
                                        />
                                        <span className={isWorking ? "font-medium" : "text-muted-foreground"}>{day}</span>
                                    </div>
                                    
                                    {isWorking ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Select value={hours.start} onValueChange={(v) => updateHours(day, 'start', v)}>
                                                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-muted-foreground">-</span>
                                            <Select value={hours.end} onValueChange={(v) => updateHours(day, 'end', v)}>
                                                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic flex-1">Unavailable</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Channels */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">Allowed Appointment Types</Label>
                    <div className="flex flex-wrap gap-4">
                        {['inPerson', 'video', 'chat', 'phone'].map(channel => (
                             <div key={channel} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={channel} 
                                    checked={profile.allowedChannels?.includes(channel as any)}
                                    onCheckedChange={(checked) => {
                                        const current = profile.allowedChannels || [];
                                        if (checked) setProfile({ ...profile, allowedChannels: [...current, channel as any] });
                                        else setProfile({ ...profile, allowedChannels: current.filter(c => c !== channel) });
                                    }}
                                />
                                <Label htmlFor={channel} className="capitalize">{channel.replace(/([A-Z])/g, ' $1').trim()}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Backup Contact */}
                 <div className="space-y-2 max-w-sm">
                    <Label>Backup Contact (for urgent absence)</Label>
                    <div className="flex gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-3" />
                        <Input 
                            placeholder="User ID or Email" 
                            value={profile.backupContactId || ""} 
                            onChange={(e) => setProfile({...profile, backupContactId: e.target.value})} 
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">This person will be notified if you mark yourself as urgently unavailable.</p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading}>Save Availability</Button>
                </div>
            </CardContent>
        </Card>
    );
}
