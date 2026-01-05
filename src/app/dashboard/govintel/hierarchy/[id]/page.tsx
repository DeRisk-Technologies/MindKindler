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
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AggregationService, AggregatedStats } from '@/services/govintel/aggregation-service';

export default function OrgDetailDashboard() {
    const params = useParams();
    const orgId = params.id as string;
    
    const [org, setOrg] = useState<Organization | null>(null);
    const [stats, setStats] = useState<AggregatedStats | null>(null);

    useEffect(() => {
        // Mock fetch org details (in real app, use OrgService)
        setOrg({
            id: orgId,
            name: 'North District LEA',
            type: 'lea',
            region: 'us-central1',
            primaryContact: { name: 'Supt. Johnson', email: 'johnson@north.edu', roleTitle: 'Superintendent' },
            address: { street: '', city: 'Northville', state: 'ST', postalCode: '', country: 'US' },
            planTier: 'professional',
            settings: { features: {}, security: { mfaRequired: true } },
            createdAt: '', updatedAt: ''
        });

        // Real Stats Fetch
        const unsubscribe = AggregationService.subscribeToStats(orgId, (data) => {
            setStats(data);
        });
        
        // Trigger initial fetch/update
        AggregationService.getStats(orgId, 'lea');

        return () => unsubscribe();
    }, [orgId]);

    const handleRefresh = async () => {
        // Force refresh logic would go here
        // For now, re-trigger getStats
        await AggregationService.getStats(orgId, 'lea');
    };

    if (!org) return <div className="p-10">Loading Organization...</div>;

    // Fallback/Loading stats
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
                    <p className="text-muted-foreground">360° Regional Overview</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Badge variant="outline" className="mr-2">{org.type.toUpperCase()}</Badge>
                    <Badge>{org.region}</Badge>
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
                        <p className="text-xs text-muted-foreground">Across all schools</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{safeStats.atRiskStudents}</div>
                        <p className="text-xs text-muted-foreground">Requires intervention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{safeStats.casesOpen}</div>
                        <p className="text-xs text-muted-foreground">Active caseload</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
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

            <Tabs defaultValue="schools" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="schools">Schools List</TabsTrigger>
                    <TabsTrigger value="staff">Staff Directory</TabsTrigger>
                    <TabsTrigger value="interventions">Intervention Plans</TabsTrigger>
                </TabsList>

                <TabsContent value="schools" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Member Institutions</CardTitle>
                            <CardDescription>Performance and risk overview for schools in this district.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    Child tenant list (Schools) will be populated here.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff">
                    <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        Staff Directory Module coming in Phase 3b.
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
