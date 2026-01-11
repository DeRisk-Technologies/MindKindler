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
import { MapPin, Phone, Mail, Globe, User, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

interface SchoolFormProps {
    initialData?: any;
    onSave: () => void;
}

export function SchoolForm({ initialData, onSave }: SchoolFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Separate State for complex nested objects
    const [senco, setSenco] = useState(initialData?.senco || { name: '', email: '', phone: '', mobile: '' });
    const [address, setAddress] = useState(initialData?.address || { street: '', city: '', postcode: '', lat: 51.5074, lng: -0.1278 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const schoolData = {
            name: formData.get('name'),
            urn: formData.get('urn'),
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
            tenantId: user.tenantId,
            updatedAt: new Date().toISOString()
        };

        try {
            const db = getRegionalDb(user.region || 'uk');
            if (initialData?.id) {
                await updateDoc(doc(db, 'schools', initialData.id), schoolData);
                toast({ title: "Updated", description: "School profile updated." });
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
                <TabsList className="w-full">
                    <TabsTrigger value="details">School Details</TabsTrigger>
                    <TabsTrigger value="senco">SENCO Profile</TabsTrigger>
                    <TabsTrigger value="location">Location & GIS</TabsTrigger>
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
                                    <Label>URN (Ofsted)</Label>
                                    <Input name="urn" defaultValue={initialData?.urn} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <div className="relative"><Phone className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="phone" className="pl-8" defaultValue={initialData?.contact?.phone} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="relative"><Mail className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="email" className="pl-8" defaultValue={initialData?.contact?.email} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <div className="relative"><Globe className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/><Input name="website" className="pl-8" defaultValue={initialData?.contact?.website} /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: SENCO (Rich Profile) */}
                <TabsContent value="senco">
                    <Card>
                        <CardHeader><CardTitle>SEN Coordinator (Key Contact)</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer">
                                    <Avatar className="h-24 w-24 border-2 border-dashed border-slate-300">
                                        <AvatarImage src={senco.photoUrl} />
                                        <AvatarFallback><User className="h-8 w-8 text-slate-400"/></AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={senco.name} onChange={e => setSenco({...senco, name: e.target.value})} placeholder="e.g. Mrs. Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Direct Mobile</Label>
                                        <Input value={senco.mobile} onChange={e => setSenco({...senco, mobile: e.target.value})} placeholder="+44 7..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Direct Email</Label>
                                        <Input value={senco.email} onChange={e => setSenco({...senco, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Availability</Label>
                                        <Input value={senco.availability} onChange={e => setSenco({...senco, availability: e.target.value})} placeholder="Mon, Wed, Fri" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Location (GIS) */}
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
                    {isSubmitting ? "Saving..." : initialData ? "Update School" : "Add School"}
                </Button>
            </div>
        </form>
    );
}
