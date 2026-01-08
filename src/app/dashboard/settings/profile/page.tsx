"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Building2, MapPin, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserProfilePage() {
    const { toast } = useToast();
    const { user: authUser } = useAuth(); // Use real auth
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!authUser) return;
            try {
                // Fetch from Firestore
                const userRef = doc(db, 'users', authUser.uid);
                const snap = await getDoc(userRef);
                
                if (snap.exists()) {
                    setProfile(snap.data());
                } else {
                    // Fallback to Auth Data if no Firestore Profile (unlikely in this flow)
                    setProfile({
                        displayName: authUser.displayName,
                        email: authUser.email,
                        role: 'User',
                        tenantId: 'default',
                        contactInfo: { phone: '' },
                        preferences: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast({ variant: "destructive", title: "Fetch Error", description: "Could not load profile." });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [authUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;
        setIsSaving(true);
        
        try {
            // Update Firestore
            const userRef = doc(db, 'users', authUser.uid);
            await updateDoc(userRef, {
                displayName: profile.displayName,
                'contactInfo.phone': profile.contactInfo?.phone || '',
                'contactInfo.jobTitle': profile.contactInfo?.jobTitle || '',
                'preferences.timezone': profile.preferences?.timezone || '',
                updatedAt: new Date().toISOString()
            });

            toast({ title: "Profile Updated", description: "Your changes have been saved." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto"/> Loading profile...</div>;
    if (!profile) return <div className="p-8 text-center">No profile found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your identity, roles, and organization memberships.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                
                {/* Identity Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={authUser?.photoURL || undefined} />
                            <AvatarFallback className="text-2xl">{profile.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg">{profile.displayName}</h3>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Mail className="h-3 w-3"/> {profile.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3"/> {profile.role}
                            </Badge>
                            {/* Region Badge - Assuming its stored in profile or determined by routing */}
                            <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3"/> {profile.region || 'Global'}
                            </Badge>
                        </div>
                         {profile.tenantId && (
                             <div className="text-xs text-muted-foreground mt-2 bg-slate-100 px-2 py-1 rounded">
                                 Tenant: {profile.tenantId}
                             </div>
                         )}
                    </CardContent>
                </Card>

                {/* Details Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <Tabs defaultValue="general">
                            <TabsList>
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="orgs">Organizations</TabsTrigger>
                                <TabsTrigger value="security">Security</TabsTrigger>
                            </TabsList>
                            
                            <div className="mt-4">
                                <TabsContent value="general">
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Display Name</Label>
                                                <Input 
                                                    value={profile.displayName || ''} 
                                                    onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Job Title</Label>
                                                <Input 
                                                    value={profile.contactInfo?.jobTitle || ''} 
                                                    onChange={(e) => setProfile({
                                                        ...profile, 
                                                        contactInfo: { ...profile.contactInfo, jobTitle: e.target.value }
                                                    })}
                                                    placeholder="e.g. Educational Psychologist" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <Input 
                                                    value={profile.contactInfo?.phone || ''} 
                                                    onChange={(e) => setProfile({
                                                        ...profile, 
                                                        contactInfo: { ...profile.contactInfo, phone: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Timezone</Label>
                                                <Input 
                                                    value={profile.preferences?.timezone || ''} 
                                                    onChange={(e) => setProfile({
                                                        ...profile, 
                                                        preferences: { ...profile.preferences, timezone: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button type="submit" disabled={isSaving}>
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                <Save className="mr-2 h-4 w-4" /> Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="orgs" className="space-y-4">
                                    <div className="space-y-3">
                                        {/* Mocking Org Memberships if not in profile yet */}
                                        {(profile.orgMemberships || [{ orgId: profile.tenantId, role: profile.role, status: 'active', joinedAt: new Date().toISOString() }]).map((org: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-slate-500"/>
                                                    <div>
                                                        <div className="font-medium">Organization: {org.orgId}</div>
                                                        <div className="text-xs text-muted-foreground">Joined {new Date(org.joinedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge>{org.role}</Badge>
                                                    {org.status === 'active' && <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="w-full">Join Another Organization</Button>
                                </TabsContent>

                                <TabsContent value="security">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <div className="space-y-0.5">
                                                <Label>Two-Factor Authentication</Label>
                                                <p className="text-sm text-muted-foreground">Secure your account with 2FA.</p>
                                            </div>
                                            <Button variant="outline" size="sm">Enable</Button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <div className="space-y-0.5">
                                                <Label>Password</Label>
                                                <p className="text-sm text-muted-foreground">Managed by Google Auth Provider.</p>
                                            </div>
                                            <Button variant="outline" size="sm" disabled>Change via Provider</Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
