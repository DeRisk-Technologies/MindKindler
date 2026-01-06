"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Organization } from '@/types/enterprise';
import { 
    School, 
    Users, 
    TrendingUp, 
    AlertCircle, 
    ArrowLeft,
    GraduationCap,
    DollarSign,
    RefreshCw,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AggregationService, AggregatedStats } from '@/services/govintel/aggregation-service';
import { orgService } from '@/services/enterprise/org-service';

export default function OrgDetailDashboard() {
    const params = useParams();
    const orgId = params.id as string;
    
    const [org, setOrg] = useState<Organization | null>(null);
    const [stats, setStats] = useState<AggregatedStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        async function fetchData() {
            try {
                setLoading(true);
                // 1. Fetch REAL organization details
                const orgData = await orgService.getOrganization(orgId);
                setOrg(orgData);

                // 2. Initial Stats fetch (trigger background aggregation)
                if (orgData) {
                    await AggregationService.getStats(orgId, orgData.type as any);
                }
            } catch (error) {
                console.error("Failed to load organization details", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        // 3. Real-time stats subscription
        const unsubscribe = AggregationService.subscribeToStats(orgId, (data) => {
            setStats(data);
        });
        
        return () => unsubscribe();
    }, [orgId]);

    const handleRefresh = async () => {
        if (org) {
            await AggregationService.getStats(orgId, org.type as any);
        }
    };

    if (loading) return <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Organization 360 View...</p>
    </div>;

    if (!org) return (
        <div className="p-20 text-center">
            <h3 className="text-lg font-bold">Organization Not Found</h3>
            <p className="text-muted-foreground">The requested educational entity could not be located.</p>
            <Button asChild className="mt-4">
                <Link href="/dashboard/govintel/hierarchy">Back to Hierarchy</Link>
            </Button>
        </div>
    );

    const safeStats = stats || {
        totalStudents: 0,
        atRiskStudents: 0,
        avgAttendance: 0,
        casesOpen: 0,
        casesResolvedLast30Days: 0,
        lastUpdated: new Date().toISOString()
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/govintel/hierarchy">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{org.name}</h2>
                    <p className="text-muted-foreground capitalize">{org.type} Dashboard • {org.region}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
                    </Button>
                    <Badge variant="secondary" className="capitalize">{org.planTier}</Badge>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{safeStats.totalStudents.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Aggregated across all child nodes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{safeStats.atRiskStudents}</div>
                        <p className="text-xs text-muted-foreground">Critical alerts active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{safeStats.casesOpen}</div>
                        <p className="text-xs text-muted-foreground">Requires clinical review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Aggregated</CardTitle>
                        <Users className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium text-gray-900">
                            {new Date(safeStats.lastUpdated).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                             {new Date(safeStats.lastUpdated).toLocaleTimeString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="nodes">Sub-Entities</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy & Policy</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Info</CardTitle>
                            <CardDescription>Primary contact and structural details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Contact:</span>
                                    <p className="font-semibold">{org.primaryContact?.name} ({org.primaryContact?.roleTitle})</p>
                                    <p>{org.primaryContact?.email}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Location:</span>
                                    <p className="font-semibold">{org.address?.city}, {org.address?.country}</p>
                                    <p>Data residency: {org.region}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="nodes">
                    <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        Detailed sub-node analytics for {org.name} coming in Phase 4.
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
