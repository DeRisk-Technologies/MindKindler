"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { enterpriseService } from '@/services/enterprise/org-service';
import { Loader2, Building, Globe } from 'lucide-react';
import { DataRegion, OrgType } from '@/types/enterprise';

export default function CreateOrgPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'school' as OrgType,
        region: 'europe-west3' as DataRegion,
        contactName: '',
        contactEmail: '',
        plan: 'professional'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await enterpriseService.createOrganization({
                name: formData.name,
                type: formData.type,
                region: formData.region,
                primaryContact: {
                    name: formData.contactName,
                    email: formData.contactEmail,
                    roleTitle: 'Admin'
                },
                address: {
                    street: '', city: '', state: '', postalCode: '', country: '' // Simplified for MVP
                },
                planTier: formData.plan as any,
                settings: {
                    features: {},
                    security: { mfaRequired: true }
                }
            });

            toast({ title: "Organization Created", description: "The entity has been provisioned." });
            // Reset or Redirect
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to create organization.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Register New Organization</h1>
                <p className="text-muted-foreground">Provision a new tenant environment with strict data residency.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary"/> Organization Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Organization Name</Label>
                                <Input 
                                    placeholder="e.g. Springfield High School" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={(v: OrgType) => setFormData({...formData, type: v})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="school">School / Institution</SelectItem>
                                        <SelectItem value="lea">LEA / District</SelectItem>
                                        <SelectItem value="state">State / Regional Board</SelectItem>
                                        <SelectItem value="national">National Ministry</SelectItem>
                                        <SelectItem value="agency">Private Agency (EPP)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Globe className="h-4 w-4"/> Data Residency Region</Label>
                            <Select value={formData.region} onValueChange={(v: DataRegion) => setFormData({...formData, region: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="europe-west3">Europe (Frankfurt) - GDPR Compliant</SelectItem>
                                    <SelectItem value="us-central1">United States (Iowa) - FERPA/HIPAA</SelectItem>
                                    <SelectItem value="asia-northeast1">Asia (Tokyo)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                <strong>Critical:</strong> This determines where all student data is physically stored. Cannot be changed later.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Primary Contact Name</Label>
                                <Input 
                                    placeholder="Jane Doe" 
                                    value={formData.contactName}
                                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Contact Email (Admin)</Label>
                                <Input 
                                    type="email"
                                    placeholder="admin@school.edu" 
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Provision Tenant
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
