// src/components/schools/SchoolForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, Globe, User, Upload, Calendar, Clock, BookOpen, Users, List, Plus, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SchoolFormProps {
    initialData?: any;
    onSave: () => void;
}

export function SchoolForm({ initialData, onSave }: SchoolFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Complex State
    const [senco, setSenco] = useState(initialData?.senco || { name: '', email: '', phone: '', mobile: '', role: '', qualifications: [], officeHours: '' });
    const [address, setAddress] = useState(initialData?.address || { street: '', city: '', postcode: '', lat: 51.5074, lng: -0.1278 });
    const [operations, setOperations] = useState(initialData?.operations || { schoolDayStart: "08:30", schoolDayEnd: "15:30", timetables: [] });
    const [calendar, setCalendar] = useState(initialData?.calendar || { termDates: [], holidays: [], events: [] });
    const [stats, setStats] = useState(initialData?.stats || { studentsOnRoll: 0, senRegister: 0, staffCount: 0 });

    // Helper for Arrays
    const addArrayItem = (obj: any, setObj: any, key: string, newItem: any) => {
        setObj({ ...obj, [key]: [...(obj[key] || []), newItem] });
    };

    const removeArrayItem = (obj: any, setObj: any, key: string, index: number) => {
        const newArr = [...(obj[key] || [])];
        newArr.splice(index, 1);
        setObj({ ...obj, [key]: newArr });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const schoolData = {
            name: formData.get('name'),
            urn: formData.get('urn'),
            type: formData.get('type'),
            contact: {
                phone: formData.get('phone'),
                email: formData.get('email'),
                website: formData.get('website'),
            },
            address: {
                ...address,
                coordinates: { lat: Number(address.lat), lng: Number(address.lng) }
            },
            senco,
            operations,
            calendar,
            stats: {
                studentsOnRoll: Number(stats.studentsOnRoll),
                senRegister: Number(stats.senRegister),
                staffCount: Number(stats.staffCount),
                activeCases: initialData?.stats?.activeCases || 0
            },
            tenantId: user.tenantId,
            updatedAt: new Date().toISOString()
        };

        try {
            const db = getRegionalDb(user.region || 'uk');
            if (initialData?.id) {
                await updateDoc(doc(db, 'schools', initialData.id), schoolData);
                toast({ title: "Updated", description: "School 360 profile updated." });
            } else {
                await addDoc(collection(db, 'schools'), { ...schoolData, createdAt: new Date().toISOString() });
                toast({ title: "Created", description: "New school added to directory." });
            }
            onSave();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save school.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="details">
                <TabsList className="w-full flex-wrap h-auto">
                    <TabsTrigger value="details">General</TabsTrigger>
                    <TabsTrigger value="senco">SENCO & Staff</TabsTrigger>
                    <TabsTrigger value="operations">Operations & Calendar</TabsTrigger>
                    <TabsTrigger value="curriculum">Curriculum & Stats</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                {/* Tab 1: General Details */}
                <TabsContent value="details">
                    <Card>
                        <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>School Name</Label>
                                    <Input name="name" defaultValue={initialData?.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select name="type" defaultValue={initialData?.type || "primary"}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="primary">Primary</SelectItem>
                                            <SelectItem value="secondary">Secondary</SelectItem>
                                            <SelectItem value="special">Special (SEND)</SelectItem>
                                            <SelectItem value="independent">Independent</SelectItem>
                                            <SelectItem value="college">College / FE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>URN (Ofsted)</Label>
                                    <Input name="urn" defaultValue={initialData?.urn} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <div className="relative"><Phone className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="phone" className="pl-8" defaultValue={initialData?.contact?.phone} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <div className="relative"><Globe className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="website" className="pl-8" defaultValue={initialData?.contact?.website} /></div>
                                </div>
                            </div>
                             <div className="space-y-2">
                                    <Label>General Email</Label>
                                    <div className="relative"><Mail className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="email" className="pl-8" defaultValue={initialData?.contact?.email} /></div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: SENCO (Rich Profile) */}
                <TabsContent value="senco">
                    <Card>
                        <CardHeader><CardTitle>SEN Coordinator (Key Contact)</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-6">
                                <div className="relative group cursor-pointer">
                                    <Avatar className="h-24 w-24 border-2 border-dashed border-slate-300">
                                        <AvatarImage src={senco.photoUrl} />
                                        <AvatarFallback><User className="h-8 w-8 text-slate-400"/></AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={senco.name} onChange={e => setSenco({...senco, name: e.target.value})} placeholder="e.g. Mrs. Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Job Title / Role</Label>
                                        <Input value={senco.role} onChange={e => setSenco({...senco, role: e.target.value})} placeholder="Assistant Head / SENCO" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Direct Mobile</Label>
                                        <Input value={senco.mobile} onChange={e => setSenco({...senco, mobile: e.target.value})} placeholder="+44 7..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Direct Email</Label>
                                        <Input value={senco.email} onChange={e => setSenco({...senco, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Office Hours / Availability</Label>
                                        <Input value={senco.officeHours} onChange={e => setSenco({...senco, officeHours: e.target.value})} placeholder="Mon-Wed, 9am - 3pm" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Qualifications</Label>
                                        <Input 
                                            placeholder="Comma separated (e.g. NASENCO, CPT3A)" 
                                            value={senco.qualifications?.join(', ')} 
                                            onChange={e => setSenco({...senco, qualifications: e.target.value.split(',').map(s => s.trim())})} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Operations & Calendar */}
                <TabsContent value="operations">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>School Day</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input type="time" value={operations.schoolDayStart} onChange={e => setOperations({...operations, schoolDayStart: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input type="time" value={operations.schoolDayEnd} onChange={e => setOperations({...operations, schoolDayEnd: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Timetable Structure</Label>
                                    {operations.timetables?.map((t: any, i: number) => (
                                        <div key={i} className="flex gap-2 items-center text-sm p-2 bg-slate-50 rounded">
                                            <Clock className="h-4 w-4 text-slate-500"/> {t.class}: {t.url ? 'Link Attached' : 'No Schedule'}
                                            <Button size="sm" variant="ghost" onClick={() => removeArrayItem(operations, setOperations, 'timetables', i)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <Input id="new-tt-class" placeholder="Class Name (e.g. Year 7)" className="h-8" />
                                        <Button size="sm" type="button" onClick={() => {
                                            const el = document.getElementById('new-tt-class') as HTMLInputElement;
                                            if (el.value) {
                                                addArrayItem(operations, setOperations, 'timetables', { class: el.value });
                                                el.value = '';
                                            }
                                        }}><Plus className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Calendar & Terms</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Term Dates</Label>
                                    {calendar.termDates?.map((t: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                            <span>{t.name}</span>
                                            <span className="text-slate-500">{t.start} - {t.end}</span>
                                            <Button size="sm" variant="ghost" onClick={() => removeArrayItem(calendar, setCalendar, 'termDates', i)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input id="term-name" placeholder="Term Name" className="h-8" />
                                        <Input id="term-start" type="date" className="h-8" />
                                        <div className="flex gap-1">
                                            <Input id="term-end" type="date" className="h-8" />
                                            <Button size="sm" type="button" onClick={() => {
                                                const n = (document.getElementById('term-name') as HTMLInputElement).value;
                                                const s = (document.getElementById('term-start') as HTMLInputElement).value;
                                                const e = (document.getElementById('term-end') as HTMLInputElement).value;
                                                if(n && s && e) addArrayItem(calendar, setCalendar, 'termDates', { name: n, start: s, end: e });
                                            }}><Plus className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 4: Curriculum & Stats */}
                <TabsContent value="curriculum">
                     <Card>
                        <CardHeader><CardTitle>School Statistics & Curriculum</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-indigo-700">{stats.studentsOnRoll}</div>
                                    <div className="text-xs text-indigo-600 uppercase tracking-wide">Students on Roll</div>
                                    <Input 
                                        type="number" 
                                        className="mt-2 h-8 text-center bg-white" 
                                        value={stats.studentsOnRoll} 
                                        onChange={e => setStats({...stats, studentsOnRoll: e.target.value})}
                                    />
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-amber-700">{stats.senRegister}</div>
                                    <div className="text-xs text-amber-600 uppercase tracking-wide">SEN Register</div>
                                    <Input 
                                        type="number" 
                                        className="mt-2 h-8 text-center bg-white" 
                                        value={stats.senRegister} 
                                        onChange={e => setStats({...stats, senRegister: e.target.value})}
                                    />
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-slate-700">{stats.staffCount}</div>
                                    <div className="text-xs text-slate-600 uppercase tracking-wide">Staff Count</div>
                                    <Input 
                                        type="number" 
                                        className="mt-2 h-8 text-center bg-white" 
                                        value={stats.staffCount} 
                                        onChange={e => setStats({...stats, staffCount: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 5: Location (GIS) */}
                <TabsContent value="location">
                    <Card>
                        <CardHeader><CardTitle>Location & GIS</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Street Address</Label>
                                <Input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Postcode</Label>
                                    <Input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Latitude</Label>
                                    <Input type="number" step="any" value={address.lat} onChange={e => setAddress({...address, lat: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Longitude</Label>
                                    <Input type="number" step="any" value={address.lng} onChange={e => setAddress({...address, lng: e.target.value})} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600">
                    {isSubmitting ? "Saving..." : initialData ? "Update School Profile" : "Add School"}
                </Button>
            </div>
        </form>
    );
}
