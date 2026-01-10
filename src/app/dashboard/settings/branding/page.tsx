// src/app/dashboard/settings/branding/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Global DB for Tenant Settings
import { Loader2, Upload, Building, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BrandingConfig {
    companyName: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    logoUrl: string;
    footerText: string;
}

export default function BrandingSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [config, setConfig] = useState<BrandingConfig>({
        companyName: "",
        address: "",
        email: "",
        phone: "",
        website: "",
        logoUrl: "",
        footerText: ""
    });

    useEffect(() => {
        if (!user) return;
        const fetchConfig = async () => {
            try {
                // Tenant settings live in Global DB
                const tenantId = user.tenantId || 'default';
                const ref = doc(db, `organizations/${tenantId}`); // Correct path for tenant metadata
                const snap = await getDoc(ref);
                
                if (snap.exists() && snap.data().branding) {
                    setConfig(snap.data().branding);
                } else if (user.displayName) {
                    // Pre-fill for independent EPPs
                    setConfig(prev => ({ ...prev, companyName: user.displayName + "'s Practice" }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const tenantId = user.tenantId || 'default';
            const ref = doc(db, `organizations/${tenantId}`);
            
            // Merge branding into organization doc
            await setDoc(ref, { 
                branding: config,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            toast({ title: "Branding Saved", description: "Your reports will now use this letterhead." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Mock Upload for Pilot
    const handleLogoUpload = () => {
        const url = prompt("Enter Logo URL (or use placeholder for Pilot):", "https://via.placeholder.com/150");
        if (url) setConfig({ ...config, logoUrl: url });
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Practice Branding</h1>
                <p className="text-muted-foreground">Configure your letterhead, logo, and footer for generated PDF reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>This appears at the top of your reports.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Practice Name</Label>
                                <Input 
                                    value={config.companyName} 
                                    onChange={e => setConfig({...config, companyName: e.target.value})} 
                                    placeholder="e.g. Acme Psychology Services"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Address</Label>
                                <Textarea 
                                    value={config.address} 
                                    onChange={e => setConfig({...config, address: e.target.value})} 
                                    placeholder="123 Clinical Way, London, UK"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Contact Email</Label>
                                    <Input value={config.email} onChange={e => setConfig({...config, email: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <Input value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Website</Label>
                                <Input value={config.website} onChange={e => setConfig({...config, website: e.target.value})} placeholder="https://..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Report Footer</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Label>Disclaimer / Footer Text</Label>
                                <Textarea 
                                    value={config.footerText} 
                                    onChange={e => setConfig({...config, footerText: e.target.value})} 
                                    placeholder="Registered in England & Wales..."
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50 p-4 flex justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32 rounded-none border-2 border-dashed p-1">
                                <AvatarImage src={config.logoUrl} className="object-contain" />
                                <AvatarFallback className="rounded-none bg-slate-50"><Building className="h-10 w-10 text-slate-300" /></AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm" onClick={handleLogoUpload}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Logo
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Recommended: 300x100px PNG transparent background.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-100 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white p-4 shadow-sm text-[10px] space-y-2">
                                <div className="flex justify-between items-start border-b pb-2 mb-2">
                                    {config.logoUrl && <img src={config.logoUrl} className="h-6 object-contain" alt="Logo" />}
                                    <div className="text-right">
                                        <div className="font-bold">{config.companyName || "Practice Name"}</div>
                                        <div className="text-slate-500">{config.address || "Address Line 1"}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-1 w-full bg-slate-100" />
                                    <div className="h-1 w-2/3 bg-slate-100" />
                                    <div className="h-1 w-1/2 bg-slate-100" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
