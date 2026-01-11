"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Globe, MoreVertical, Loader2, Pencil, GitBranch, ArrowUp, Link as LinkIcon, X, Database } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types/enterprise';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { orgService } from '@/services/enterprise/org-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export default function TenantManagementPage() {
    const { toast } = useToast();
    const [tenants, setTenants] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal State
    const [editingTenant, setEditingTenant] = useState<Organization | null>(null);
    const [editingParent, setEditingParent] = useState<Organization | null>(null);
    const [editingChildren, setEditingChildren] = useState<Organization[]>([]);
    
    // Re-assignment State
    const [availableParents, setAvailableParents] = useState<Organization[]>([]);
    const [isReassigning, setIsReassigning] = useState(false);
    const [newParentId, setNewParentId] = useState<string>("");

    const [isSaving, setIsSaving] = useState(false);
    
    // Provisioning State
    const [provisioningId, setProvisioningId] = useState<string | null>(null);

    async function fetchTenants() {
        setLoading(true);
        try {
            const data = await orgService.getAllOrganizations();
            setTenants(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load tenants.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTenants();
    }, []);

    // When opening edit modal, fetch lineage
    useEffect(() => {
        async function loadLineage() {
            if (!editingTenant) return;
            
            // 1. Load Current Parent
            if (editingTenant.parentId) {
                const p = await orgService.getOrganization(editingTenant.parentId);
                setEditingParent(p);
                setNewParentId(p?.id || "");
            } else {
                setEditingParent(null);
                setNewParentId("none");
            }

            // 2. Load Children
            const kids = tenants.filter(t => t.parentId === editingTenant.id);
            setEditingChildren(kids);

            // 3. Load Potential Parents for Re-assignment
            const potentials = await orgService.getPotentialParents(editingTenant.type);
            const safePotentials = potentials.filter(p => 
                p.id !== editingTenant.id && 
                p.region === editingTenant.region 
            );
            setAvailableParents(safePotentials);
        }
        loadLineage();
    }, [editingTenant, tenants]);

    const handleUpdate = async () => {
        if (!editingTenant) return;
        setIsSaving(true);
        try {
            const finalParentId = newParentId === "none" ? null : newParentId;
            
            await orgService.updateOrganization(editingTenant.id, {
                ...editingTenant,
                parentId: finalParentId as string 
            });
            
            toast({ title: "Updated", description: "Organization details and hierarchy saved." });
            setEditingTenant(null);
            setIsReassigning(false);
            fetchTenants();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleProvisionData = async (tenantId: string) => {
        if (!confirm(`Are you sure you want to INJECT Pilot Data into tenant ${tenantId}? This is for demos only.`)) return;
        
        setProvisioningId(tenantId);
        try {
            // Using the unified provisioner
            const provisionFn = httpsCallable(functions, 'provisionTenantData');
            
            await provisionFn({ 
                targetTenantId: tenantId, 
                action: 'seed_pilot_uk' 
            });
            
            toast({ title: "Provisioned", description: `Pilot data injected into ${tenantId}.` });
        } catch (e: any) {
            console.error(e);
            toast({ title: "Provisioning Error", description: e.message, variant: "destructive" });
        } finally {
            setProvisioningId(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
                    <p className="text-muted-foreground">Global overview and configuration of all educational entities.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/admin/enterprise/new">
                        <Plus className="mr-2 h-4 w-4"/> Provision New Tenant
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Entities ({tenants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Primary Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map(tenant => (
                                <TableRow key={tenant.id}>
                                    <TableCell>
                                        <div className="font-medium">{tenant.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{tenant.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{tenant.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{tenant.region}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">{tenant.primaryContact?.email}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                             <Button variant="ghost" size="sm" onClick={() => setEditingTenant(tenant)}>
                                                <Pencil className="h-4 w-4 mr-2"/> Edit
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        {provisioningId === tenant.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreVertical className="h-4 w-4"/>}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/govintel/hierarchy/${tenant.id}`}>View Dashboard</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleProvisionData(tenant.id)} disabled={!!provisioningId}>
                                                        <Database className="mr-2 h-4 w-4"/> Provision Pilot Data
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">Suspend Access</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Edit Organization</DialogTitle></DialogHeader>
                    
                    {editingTenant && (
                        <Tabs defaultValue="hierarchy" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="hierarchy">Hierarchy & Lineage</TabsTrigger>
                                <TabsTrigger value="details">Basic Details</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Official Name</Label>
                                    <Input 
                                        value={editingTenant.name} 
                                        onChange={e => setEditingTenant({...editingTenant, name: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contact Name</Label>
                                        <Input 
                                            value={editingTenant.primaryContact?.name} 
                                            onChange={e => setEditingTenant({...editingTenant, primaryContact: {...editingTenant.primaryContact, name: e.target.value}})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input 
                                            value={editingTenant.primaryContact?.email} 
                                            onChange={e => setEditingTenant({...editingTenant, primaryContact: {...editingTenant.primaryContact, email: e.target.value}})} 
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="hierarchy" className="space-y-4 py-4">
                                {/* Parent Section */}
                                <div className="p-4 bg-blue-50 rounded border border-blue-100 transition-all">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                                            <ArrowUp className="h-4 w-4"/> Parent Entity
                                        </div>
                                        {!isReassigning && (
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-700 hover:text-blue-900" onClick={() => setIsReassigning(true)}>
                                                <LinkIcon className="h-3 w-3 mr-1"/> Change Parent
                                            </Button>
                                        )}
                                    </div>

                                    {isReassigning ? (
                                        <div className="flex gap-2 animate-in fade-in">
                                            <Select value={newParentId} onValueChange={setNewParentId}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select new parent..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- No Parent (Root) --</SelectItem>
                                                    {availableParents.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" onClick={() => setIsReassigning(false)}>
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ) : (
                                        editingParent ? (
                                            <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-200">
                                                <div>
                                                    <div className="font-medium text-sm text-blue-900">{editingParent.name}</div>
                                                    <div className="text-xs text-muted-foreground uppercase">{editingParent.type} • {editingParent.region}</div>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50">Current</Badge>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic p-2 border border-dashed rounded text-center">
                                                This is a top-level organization (Root).
                                            </p>
                                        )
                                    )}
                                </div>

                                {/* Current Node */}
                                <div className="flex items-center justify-center py-1">
                                    <div className="h-6 w-px bg-slate-300"></div>
                                </div>
                                <div className="p-3 bg-white border-2 border-primary rounded text-center shadow-sm">
                                    <div className="font-bold">{editingTenant.name}</div>
                                    <div className="text-xs text-muted-foreground">Current Entity ({editingTenant.type})</div>
                                </div>
                                <div className="flex items-center justify-center py-1">
                                    <div className="h-6 w-px bg-slate-300"></div>
                                </div>

                                {/* Children Section */}
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-800">
                                        <GitBranch className="h-4 w-4"/> Direct Sub-Entities ({editingChildren.length})
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {editingChildren.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic text-center py-2">No sub-entities attached.</p>
                                        ) : (
                                            editingChildren.map(child => (
                                                <div key={child.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                                    <span className="truncate max-w-[200px]">{child.name}</span> 
                                                    <Badge variant="secondary" className="text-[10px]">{child.type}</Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTenant(null)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
