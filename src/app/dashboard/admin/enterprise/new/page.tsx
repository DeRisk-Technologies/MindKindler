"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, Building, Globe, Search, Command } from 'lucide-react';
import { DataRegion, OrgType } from '@/types/enterprise';
import { UK_LEA_LIST } from '@/lib/data/gov/uk-lea-list';
import { GLOBAL_LEA_DATA } from '@/lib/data/gov/global-lea-data';

export default function CreateOrgPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'school' as OrgType,
        region: 'europe-west3' as DataRegion,
        contactName: '',
        contactEmail: '',
        plan: 'professional',
        leaId: ''
    });

    // Unified LEA Lookup Logic
    const [leaSearch, setLeaSearch] = useState('');
    
    // Get list based on region
    const getReferenceLeas = () => {
        if (formData.region === 'europe-west2') return UK_LEA_LIST;
        return GLOBAL_LEA_DATA[formData.region] || [];
    };

    const referenceLeas = getReferenceLeas();
    const filteredLeas = referenceLeas.filter(lea => 
        lea.name.toLowerCase().includes(leaSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const provisionFn = httpsCallable(functions, 'provisionEnterpriseTenantV2');
            const result = await provisionFn({
                name: formData.name,
                type: formData.type,
                region: formData.region,
                contactName: formData.contactName,
                contactEmail: formData.contactEmail,
                planTier: formData.plan,
                metadata: { leaId: formData.leaId }
            });

            const response = result.data as any;
            toast({ title: "Provisioning Successful", description: response.message || "Tenant created." });
            setFormData({ ...formData, name: '', contactName: '', contactEmail: '', leaId: '' });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Provisioning Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Register New Organization</h1>
                <p className="text-muted-foreground">International Enterprise Provisioning Orchestrator.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary"/> Global Entity Definition
                    </CardTitle>
                    <CardDescription>
                        Select from standardized regional lists to ensure cross-border data integrity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Region & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Globe className="h-4 w-4"/> Data Residency Region</Label>
                                <Select value={formData.region} onValueChange={(v: DataRegion) => {
                                    setFormData({...formData, region: v, leaId: ''});
                                    setLeaSearch('');
                                }}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="us-central1">USA (Iowa)</SelectItem>
                                        <SelectItem value="europe-west2">UK (London)</SelectItem>
                                        <SelectItem value="europe-west3">Germany (Frankfurt)</SelectItem>
                                        <SelectItem value="europe-west1">France (Belgium/Paris)</SelectItem>
                                        <SelectItem value="me-central2">Saudi Arabia (Dammam)</SelectItem>
                                        <SelectItem value="northamerica-northeast1">Canada (Montreal)</SelectItem>
                                        <SelectItem value="asia-northeast1">Japan (Tokyo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Organization Type</Label>
                                <Select value={formData.type} onValueChange={(v: OrgType) => setFormData({...formData, type: v})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="national">National Ministry / Department</SelectItem>
                                        <SelectItem value="state">State / Prefectural Board</SelectItem>
                                        <SelectItem value="lea">District / LEA / Local Authority</SelectItem>
                                        <SelectItem value="school">Individual School</SelectItem>
                                        <SelectItem value="agency">Private Agency (EPP)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Standardized Selection for Global Regions */}
                        {filteredLeas.length > 0 && (formData.type === 'lea' || formData.type === 'school') && (
                            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Command className="h-4 w-4" /> Global Registry Lookup
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Select Educational Authority</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search registry..." 
                                                className="pl-8 bg-white"
                                                value={leaSearch}
                                                onChange={(e) => setLeaSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Select value={formData.leaId} onValueChange={(v) => {
                                        const selected = referenceLeas.find(l => l.id === v);
                                        setFormData({...formData, leaId: v, name: selected?.name || ''});
                                    }}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Choose from verified list..." /></SelectTrigger>
                                        <SelectContent>
                                            {filteredLeas.map(lea => (
                                                <SelectItem key={lea.id} value={lea.id}>{lea.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Custom Name (Fallback or Manual) */}
                        <div className="space-y-2">
                            <Label>Organization Official Name</Label>
                            <Input 
                                placeholder="e.g. Los Angeles Unified School District" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Admin Contact Name</Label>
                                <Input placeholder="Jane Doe" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} required />
                            </div>
                             <div className="space-y-2">
                                <Label>Admin Contact Email</Label>
                                <Input type="email" placeholder="admin@school.edu" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} required />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Provision Global Environment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
