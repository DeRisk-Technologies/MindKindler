"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Globe, MoreVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types/enterprise';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock Data - In prod, fetch from enterpriseService
const MOCK_TENANTS: Organization[] = [
    {
        id: 't_1',
        name: 'Ministry of Education (National)',
        type: 'national',
        region: 'europe-west3',
        planTier: 'enterprise',
        primaryContact: { name: 'Director General', email: 'dg@gov.uk', roleTitle: 'DG' },
        address: { city: 'London', country: 'UK', street: '', state: '', postalCode: '' },
        settings: { features: {}, security: { mfaRequired: true } },
        createdAt: '2023-01-01'
    },
    {
        id: 't_2',
        name: 'California Dept of Education',
        type: 'state',
        region: 'us-central1',
        planTier: 'enterprise',
        primaryContact: { name: 'State Admin', email: 'admin@cde.ca.gov', roleTitle: 'Admin' },
        address: { city: 'Sacramento', country: 'US', street: '', state: 'CA', postalCode: '' },
        settings: { features: {}, security: { mfaRequired: true } },
        createdAt: '2023-02-15'
    },
    {
        id: 't_3',
        name: 'Springfield School District',
        type: 'lea',
        region: 'us-central1',
        planTier: 'professional',
        primaryContact: { name: 'Supt. Chalmers', email: 'chalmers@springfield.edu', roleTitle: 'Superintendent' },
        address: { city: 'Springfield', country: 'US', street: '', state: 'IL', postalCode: '' },
        settings: { features: {}, security: { mfaRequired: true } },
        createdAt: '2023-03-10'
    }
];

export default function TenantManagementPage() {
    const { toast } = useToast();
    const [tenants, setTenants] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetch
        setTimeout(() => {
            setTenants(MOCK_TENANTS);
            setLoading(false);
        }, 800);
    }, []);

    const handleAction = (action: string, tenantId: string) => {
        toast({ title: `Action: ${action}`, description: `Processing for tenant ${tenantId}` });
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
                    <p className="text-muted-foreground">Global overview of all registered organizations.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/admin/enterprise/new">
                        <Plus className="mr-2 h-4 w-4"/> Provision New Tenant
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Tenants</CardTitle>
                    <CardDescription>Manage subscription status, data residency, and access.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Primary Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map(tenant => (
                                <TableRow key={tenant.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-md">
                                                <Building2 className="h-4 w-4 text-slate-600"/>
                                            </div>
                                            <div>
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground">ID: {tenant.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{tenant.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Globe className="h-3 w-3 text-muted-foreground"/>
                                            {tenant.region}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={tenant.planTier === 'enterprise' ? 'bg-purple-600' : 'bg-blue-600'}>
                                            {tenant.planTier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{tenant.primaryContact.email}</div>
                                        <div className="text-xs text-muted-foreground">{tenant.primaryContact.name}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleAction('View Hierarchy', tenant.id)}>
                                                    View Hierarchy
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction('Manage Billing', tenant.id)}>
                                                    Manage Billing
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction('Suspend', tenant.id)} className="text-red-600">
                                                    Suspend Tenant
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
