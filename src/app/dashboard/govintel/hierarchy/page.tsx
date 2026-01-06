"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orgService } from '@/services/enterprise/org-service';
import { Organization } from '@/types/enterprise';
import { Network, Plus, School, Building2, Landmark, MapPin, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function HierarchyDashboard() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOrgs() {
            try {
                const data = await orgService.getAllOrganizations();
                setOrganizations(data);
            } catch (e) {
                console.error("Hierarchy load failed", e);
            } finally {
                setLoading(false);
            }
        }
        loadOrgs();
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

    // Filter for top-level orgs (no parentId)
    const rootOrgs = organizations.filter(o => !o.parentId);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organization Hierarchy</h2>
                    <p className="text-muted-foreground">Real-time view of your educational ecosystem.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/admin/enterprise/new">
                            <Plus className="mr-2 h-4 w-4"/> Register New Org
                        </Link>
                    </Button>
                </div>
            </div>

            {rootOrgs.length === 0 ? (
                <Card className="p-20 text-center text-muted-foreground border-dashed">
                    <p>No educational entities found. Start by provisioning a National or State body.</p>
                </Card>
            ) : (
                rootOrgs.map(root => (
                    <div key={root.id} className="space-y-4 mb-12">
                        {/* Root Node (National/State) */}
                        <Card className="border-l-4 border-l-primary shadow-sm">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            {getIcon(root.type)}
                                        </div>
                                        <div>
                                            <CardTitle>{root.name}</CardTitle>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className="capitalize">{root.type}</Badge>
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3"/> {root.region}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/govintel/hierarchy/${root.id}`}>Open Dashboard</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Sub-Entities (Children) */}
                        <div className="relative pl-8 border-l-2 border-dashed border-gray-200 space-y-4">
                            {organizations.filter(o => o.parentId === root.id).map(child => (
                                <div key={child.id} className="relative">
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
                                                        <p className="text-xs text-muted-foreground capitalize">{child.type} in {child.region}</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/govintel/hierarchy/${child.id}`}>View</Link>
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </div>
                            ))}
                            
                            {/* Empty state connector */}
                            {organizations.filter(o => o.parentId === root.id).length === 0 && (
                                <p className="text-xs text-muted-foreground italic ml-2">No sub-entities registered yet.</p>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
