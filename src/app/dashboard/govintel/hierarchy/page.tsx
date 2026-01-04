"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { enterpriseService } from '@/services/enterprise/org-service';
import { Organization } from '@/types/enterprise';
import { Network, Plus, School, Building2, Landmark, MapPin } from 'lucide-react';
import Link from 'next/link';

// Mock Data for hierarchical visualization
const MOCK_ROOT_ORG: Organization = {
    id: 'root-1',
    name: 'Department of Education (State)',
    type: 'state',
    region: 'us-central1',
    primaryContact: { name: 'Director Smith', email: 'director@state.gov', roleTitle: 'Director' },
    address: { street: '', city: 'Capital City', state: 'ST', postalCode: '', country: 'US' },
    planTier: 'enterprise',
    settings: { features: {}, security: { mfaRequired: true } },
    createdAt: '', updatedAt: ''
};

export default function HierarchyDashboard() {
    const [rootOrg, setRootOrg] = useState<Organization | null>(MOCK_ROOT_ORG);
    const [children, setChildren] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);

    // In a real app, load children from service based on current user's org context
    useEffect(() => {
        // Simulation
        setChildren([
            {
                id: 'lea-1',
                name: 'North District LEA',
                type: 'lea',
                region: 'us-central1',
                primaryContact: { name: 'Supt. Johnson', email: 'johnson@north.edu', roleTitle: 'Superintendent' },
                address: { street: '', city: 'Northville', state: 'ST', postalCode: '', country: 'US' },
                planTier: 'professional',
                settings: { features: {}, security: { mfaRequired: true } },
                createdAt: '', updatedAt: '',
                parentId: 'root-1'
            },
            {
                id: 'lea-2',
                name: 'South District LEA',
                type: 'lea',
                region: 'us-central1',
                primaryContact: { name: 'Supt. Davis', email: 'davis@south.edu', roleTitle: 'Superintendent' },
                address: { street: '', city: 'Southville', state: 'ST', postalCode: '', country: 'US' },
                planTier: 'professional',
                settings: { features: {}, security: { mfaRequired: true } },
                createdAt: '', updatedAt: '',
                parentId: 'root-1'
            }
        ]);
    }, []);

    const getIcon = (type: string) => {
        switch(type) {
            case 'national': return <Landmark className="h-5 w-5"/>;
            case 'state': return <Building2 className="h-5 w-5"/>;
            case 'lea': return <Network className="h-5 w-5"/>;
            case 'school': return <School className="h-5 w-5"/>;
            default: return <Building2 className="h-5 w-5"/>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organization Hierarchy</h2>
                    <p className="text-muted-foreground">Manage the structural relationship between educational entities.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/admin/enterprise/new">
                        <Plus className="mr-2 h-4 w-4"/> Add Sub-Organization
                    </Link>
                </Button>
            </div>

            {/* Root Node */}
            <Card className="border-l-4 border-l-primary mb-8">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-full">
                                {getIcon(rootOrg?.type || 'state')}
                            </div>
                            <div>
                                <CardTitle>{rootOrg?.name}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline">{rootOrg?.type.toUpperCase()}</Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3"/> {rootOrg?.region}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-medium">{rootOrg?.primaryContact.name}</div>
                             <div className="text-xs text-muted-foreground">{rootOrg?.primaryContact.email}</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                         <div className="p-4 bg-muted/20 rounded-lg">
                             <div className="text-2xl font-bold">2</div>
                             <div className="text-xs text-muted-foreground uppercase">Districts (LEAs)</div>
                         </div>
                         <div className="p-4 bg-muted/20 rounded-lg">
                             <div className="text-2xl font-bold">45</div>
                             <div className="text-xs text-muted-foreground uppercase">Total Schools</div>
                         </div>
                         <div className="p-4 bg-muted/20 rounded-lg">
                             <div className="text-2xl font-bold">12k</div>
                             <div className="text-xs text-muted-foreground uppercase">Students</div>
                         </div>
                    </div>
                </CardContent>
            </Card>

            {/* Children Nodes (LEAs) */}
            <div className="relative pl-8 border-l-2 border-dashed border-gray-200 space-y-6">
                {children.map(child => (
                    <div key={child.id} className="relative">
                        {/* Connector Line */}
                        <div className="absolute -left-[34px] top-6 w-8 h-px border-t-2 border-dashed border-gray-200"></div>
                        
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="py-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                                            {getIcon(child.type)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{child.name}</h4>
                                            <p className="text-xs text-muted-foreground">{child.address.city}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/govintel/hierarchy/${child.id}`}>View Details</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
