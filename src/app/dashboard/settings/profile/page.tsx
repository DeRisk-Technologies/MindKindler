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
import { User, Mail, Shield, Building2, MapPin, Loader2 } from 'lucide-react';
import { UserProfile } from '@/types/user-profile';

// Mock current user
const MOCK_USER: UserProfile = {
    id: 'user_123',
    email: 'sarah.jones@example.com',
    displayName: 'Dr. Sarah Jones',
    role: 'EPP',
    tenantId: 'tenant_abc',
    orgMemberships: [
        { orgId: 'tenant_abc', role: 'EPP', status: 'active', joinedAt: '2023-01-01' },
        { orgId: 'lea_north', role: 'GovAnalyst', status: 'active', joinedAt: '2023-06-01' }
    ],
    contactInfo: {
        phone: '+15550101',
    },
    preferences: {
        language: 'en-US',
        theme: 'light',
        notifications: { email: true, push: false, sms: false },
        timezone: 'America/New_York'
    },
    metadata: {
        lastLogin: '2023-10-27T10:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        region: 'us-central1'
    }
};

export default function UserProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // In prod: fetch from Firestore via useAuth()
        setTimeout(() => {
            setUser(MOCK_USER);
            setLoading(false);
        }, 800);
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
        }, 1000);
    };

    if (loading || !user) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your identity, roles, and organization memberships.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                
                {/* Identity Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg">{user.displayName}</h3>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Mail className="h-3 w-3"/> {user.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3"/> {user.role}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3"/> {user.metadata.region}
                            </Badge>
                        </div>
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
                                <TabsContent value="general" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input defaultValue={user.displayName} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Job Title</Label>
                                            <Input placeholder="e.g. Senior Psychologist" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input defaultValue={user.contactInfo.phone} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <Input defaultValue={user.preferences.timezone} />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="orgs" className="space-y-4">
                                    <div className="space-y-3">
                                        {user.orgMemberships.map((org, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-slate-500"/>
                                                    <div>
                                                        <div className="font-medium">Organization ID: {org.orgId}</div>
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
                                                <p className="text-sm text-muted-foreground">Last changed 3 months ago.</p>
                                            </div>
                                            <Button variant="outline" size="sm">Change Password</Button>
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
