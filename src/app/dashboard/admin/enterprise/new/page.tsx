"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, Building, Globe, MapPin, CheckCircle2 } from 'lucide-react';
import { DataRegion, OrgType } from '@/types/enterprise';
import { GlobalHierarchySelector } from "@/components/enterprise/hierarchy/GlobalHierarchySelector";
import { OrgUnit } from '@/types/hierarchy';
import { Badge } from "@/components/ui/badge"; 
import { usePermissions } from '@/hooks/use-permissions'; // Added for context-awareness

export default function CreateOrgPage() {
    const { toast } = useToast();
    const { shardId: myShardId, hasRole } = usePermissions(); // Get user context
    const [loading, setLoading] = useState(false);
    
    // Determine default region:
    // If Global SuperAdmin, default to UK (can change).
    // If Regional Admin (locked to shard), default to that region (locked).
    const defaultRegion = (myShardId && myShardId !== 'default') 
        ? myShardId.replace('mindkindler-', '') 
        : 'europe-west2';

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'school' as OrgType,
        region: defaultRegion as DataRegion, 
        contactName: '',
        contactEmail: '',
        plan: 'professional',
        parentId: '',
        leaId: ''
    });

    const [selectedNode, setSelectedNode] = useState<OrgUnit | null>(null);

    // Is the user locked to a region?
    const isRegionLocked = myShardId && myShardId !== 'default';

    // Helper: Map Wizard Types to Enterprise Types
    const mapHierarchyType = (hType: string): OrgType => {
        if (hType.includes('national')) return 'national';
        if (['state', 'prefecture', 'bundesland', 'region_uk'].includes(hType)) return 'state';
        if (['lea', 'district', 'local_authority', 'municipality'].includes(hType)) return 'lea';
        return 'school';
    };

    // Helper: Map Region Dropdown to Country Code for Wizard
    const getCountryCode = (region: string) => { // relaxed type to allow strings from select
        if (region === 'europe-west2' || region === 'uk') return 'UK';
        if (region.startsWith('us')) return 'US';
        if (region === 'europe-west3' || region === 'eu') return 'DE'; // Assuming EU default is Germany for now
        if (region === 'europe-west1') return 'FR';
        if (region.startsWith('me')) return 'SA';
        if (region.startsWith('asia')) return 'JP';
        return 'US';
    };

    const handleWizardCompletion = (node: OrgUnit) => {
        setSelectedNode(node);
        setFormData(prev => ({
            ...prev,
            name: node.name,
            type: mapHierarchyType(node.type),
            parentId: node.parentId || '', // Link to parent in hierarchy
            leaId: node.id // Store reference to registry ID
        }));
        toast({ title: "Organization Selected", description: `Configured for ${node.name}` });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const provisionFn = httpsCallable(functions, 'provisionEnterpriseTenantV2');
            await provisionFn({
                ...formData,
                planTier: formData.plan,
                parentId: formData.parentId || undefined,
                metadata: { 
                    registryId: formData.leaId, 
                    hierarchyPath: selectedNode?.ancestors 
                }
            });

            toast({ title: "Success", description: "Tenant provisioned successfully." });
            // Reset
            setFormData(prev => ({ ...prev, name: '', contactName: '', contactEmail: '' }));
            setSelectedNode(null);
        } catch (error: any) {
            console.error("Provisioning error:", error);
            toast({ title: "Provisioning Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
            <div className="space-y-2 text-center mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Register New Organization</h1>
                <p className="text-muted-foreground text-lg">Define the entity's place in the Global Education Hierarchy.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                
                {/* LEFT COLUMN: The Wizard (3/5 width) */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-t-4 border-t-blue-600 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600"/> Step 1: Hierarchy Locator</CardTitle>
                            <CardDescription>Select the Data Region, then drill down to the specific entity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Data Residency Region</Label>
                                {isRegionLocked ? (
                                    <div className="p-3 bg-muted rounded-md flex items-center gap-2 border">
                                        <Globe className="h-4 w-4" />
                                        <span className="font-medium">
                                            {getCountryCode(formData.region)} (Locked to {formData.region})
                                        </span>
                                    </div>
                                ) : (
                                    <Select value={formData.region} onValueChange={(v: DataRegion) => setFormData({...formData, region: v, name: '', parentId: ''})}>
                                        <SelectTrigger className="h-12 text-base"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="europe-west2">🇬🇧 UK (London)</SelectItem>
                                            <SelectItem value="us-central1">🇺🇸 USA (Iowa)</SelectItem>
                                            <SelectItem value="europe-west3">🇩🇪 Germany (Frankfurt)</SelectItem>
                                            <SelectItem value="europe-west1">🇫🇷 France (Paris)</SelectItem>
                                            <SelectItem value="me-central2">🇸🇦 Saudi Arabia (Dammam)</SelectItem>
                                            <SelectItem value="asia-northeast1">🇯🇵 Japan (Tokyo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* THE WIZARD COMPONENT */}
                            <div className="pt-2">
                                <GlobalHierarchySelector 
                                    key={formData.region} // Force reset on region change
                                    initialCountry={getCountryCode(formData.region)}
                                    onComplete={handleWizardCompletion}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: The Confirmation Form (2/5 width) */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className={`border-t-4 shadow-lg transition-colors ${selectedNode ? 'border-t-green-500 bg-green-50/10' : 'border-t-gray-300 opacity-80'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {selectedNode ? <CheckCircle2 className="h-5 w-5 text-green-600"/> : <Building className="h-5 w-5 text-gray-400"/>} 
                                Step 2: Tenant Configuration
                            </CardTitle>
                            <CardDescription>
                                {selectedNode ? "Review and provision access." : "Complete the hierarchy selection first."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Official Name</Label>
                                    <Input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="font-semibold bg-white"
                                        placeholder="Auto-filled from wizard..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Organization Type</Label>
                                    <Badge variant="outline" className="ml-2 uppercase">{formData.type}</Badge>
                                    {/* Hidden input to keep logic working if we wanted to change it manually, but usually auto-derived */}
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Admin Contact Name</Label>
                                        <Input placeholder="Full Name" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Admin Contact Email</Label>
                                        <Input type="email" placeholder="admin@org.edu" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} required />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Label>Subscription Plan</Label>
                                    <Select value={formData.plan} onValueChange={(v) => setFormData({...formData, plan: v})}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="essential">Essential</SelectItem>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" disabled={loading || !selectedNode} className="w-full h-12 text-lg mt-4 shadow-md">
                                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                                    Provision Tenant
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
