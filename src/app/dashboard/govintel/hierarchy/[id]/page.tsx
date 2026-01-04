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
    DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock Aggregated Data (In prod: Aggregate via Cloud Functions)
const MOCK_AGGREGATES = {
    totalStudents: 4500,
    studentsAtRisk: 120,
    totalBudget: 2500000,
    budgetUtilized: 1800000,
    staffCount: 320,
    eppCount: 15,
    schools: [
        { id: 's1', name: 'Lincoln High', riskScore: 'Low', students: 1200 },
        { id: 's2', name: 'Washington Elementary', riskScore: 'Medium', students: 800 },
        { id: 's3', name: 'Kennedy Middle', riskScore: 'High', students: 950 }
    ]
};

export default function OrgDetailDashboard() {
    const params = useParams();
    const [org, setOrg] = useState<Organization | null>(null);
    const [stats, setStats] = useState(MOCK_AGGREGATES);

    useEffect(() => {
        // Mock fetch org details
        setOrg({
            id: params.id as string,
            name: 'North District LEA',
            type: 'lea',
            region: 'us-central1',
            primaryContact: { name: 'Supt. Johnson', email: 'johnson@north.edu', roleTitle: 'Superintendent' },
            address: { street: '', city: 'Northville', state: 'ST', postalCode: '', country: 'US' },
            planTier: 'professional',
            settings: { features: {}, security: { mfaRequired: true } },
            createdAt: '', updatedAt: ''
        });
    }, [params.id]);

    if (!org) return <div>Loading...</div>;

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
                <div className="ml-auto">
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
                        <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.studentsAtRisk}</div>
                        <p className="text-xs text-muted-foreground">Requires intervention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round((stats.budgetUtilized / stats.totalBudget) * 100)}%</div>
                        <p className="text-xs text-muted-foreground">${(stats.budgetUtilized/1000000).toFixed(1)}M / ${(stats.totalBudget/1000000).toFixed(1)}M</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff & EPPs</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.staffCount}</div>
                        <p className="text-xs text-muted-foreground">{stats.eppCount} External Partners</p>
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
                                {stats.schools.map(school => (
                                    <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-100 rounded-full">
                                                <School className="h-5 w-5 text-slate-700"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{school.name}</h4>
                                                <p className="text-xs text-muted-foreground">{school.students} Students</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-medium">Risk Level</div>
                                                <Badge variant={school.riskScore === 'High' ? 'destructive' : 'outline'}>
                                                    {school.riskScore}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </div>
                                    </div>
                                ))}
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
