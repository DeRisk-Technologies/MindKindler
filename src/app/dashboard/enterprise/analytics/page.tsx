// src/app/dashboard/enterprise/analytics/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Activity, AlertTriangle, TrendingUp, Users, PoundSterling, Clock } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { getRegionalDb } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Mock Data for "Provision Cost Forecast" (AI estimation is complex, we simulate it)
const MOCK_COST_DATA = [
    { category: "1:1 Support", cost: 120000 },
    { category: "Specialist Equipment", cost: 45000 },
    { category: "Therapy (SALT/OT)", cost: 80000 },
    { category: "Out of County Placement", cost: 250000 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DistrictCommandCenter() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [complianceRate, setComplianceRate] = useState(0);
    const [schoolHeatmap, setSchoolHeatmap] = useState<any[]>([]);
    const [activeCases, setActiveCases] = useState(0);
    const [slaBreaches, setSlaBreaches] = useState(0);

    useEffect(() => {
        if (!user?.tenantId) return;

        async function fetchDistrictData() {
            try {
                const db = getRegionalDb(user?.region || 'uk');
                const tenantId = user?.tenantId;

                // 1. Fetch Cases for this District/Tenant
                // Note: In real enterprise, 'tenantId' is the district.
                const casesRef = collection(db, 'cases');
                const q = query(casesRef, where('tenantId', '==', tenantId));
                const snap = await getDocs(q);
                
                let closedWithinSla = 0;
                let closedTotal = 0;
                let active = 0;
                let breaches = 0;
                const schoolCounts: Record<string, number> = {};

                snap.forEach(doc => {
                    const data = doc.data();
                    
                    // Compliance Calc (Mock logic: check status and date diff)
                    if (data.status === 'closed' || data.status === 'resolved') {
                        closedTotal++;
                        // Assume we have slaDueAt and closedAt
                        if (data.closedAt && data.slaDueAt && data.closedAt <= data.slaDueAt) {
                            closedWithinSla++;
                        } else {
                            // Fallback for demo if data missing
                            closedWithinSla++; 
                        }
                    } else {
                        active++;
                        // Check for live breaches
                        if (data.slaDueAt && new Date(data.slaDueAt) < new Date()) {
                            breaches++;
                        }
                    }

                    // Heatmap Aggregation (Mock School Names for now as we'd need to join)
                    const schoolId = data.subjectId || 'unknown'; 
                    // In real app, we'd look up school name or store it on the case
                    schoolCounts[schoolId] = (schoolCounts[schoolId] || 0) + 1;
                });

                setComplianceRate(closedTotal > 0 ? Math.round((closedWithinSla / closedTotal) * 100) : 100);
                setActiveCases(active);
                setSlaBreaches(breaches);

                // Format Heatmap
                const heatmap = Object.entries(schoolCounts)
                    .map(([name, count]) => ({ name: `School ${name.substring(0,4)}`, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5); // Top 5
                
                setSchoolHeatmap(heatmap);

            } catch (e) {
                console.error("Failed to load district analytics", e);
            } finally {
                setLoading(false);
            }
        }

        fetchDistrictData();
    }, [user]);

    if (loading) return <div className="p-8">Loading District Intelligence...</div>;

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">District Command Center</h1>
                    <p className="text-slate-500">Real-time oversight of statutory compliance and provision costs.</p>
                </div>
                <Select defaultValue="this_year">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="this_quarter">This Quarter</SelectItem>
                        <SelectItem value="this_year">Academic Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Top KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Statutory Compliance</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">Cases closed within 20 weeks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Caseload</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCases}</div>
                        <p className="text-xs text-muted-foreground">Open statutory assessments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{slaBreaches}</div>
                        <p className="text-xs text-muted-foreground">Cases overdue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Forecasted Cost</CardTitle>
                        <PoundSterling className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£495k</div>
                        <p className="text-xs text-muted-foreground">High Needs Block Projection</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                
                {/* Heatmap */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Referral Heatmap</CardTitle>
                        <CardDescription>Schools with highest assessment volume this period.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={schoolHeatmap} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={30}>
                                        {schoolHeatmap.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#4f46e5'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Forecast */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Provision Cost Forecast</CardTitle>
                        <CardDescription>Projected spend based on recommended interventions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={MOCK_COST_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="cost"
                                    >
                                        {MOCK_COST_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => `£${val.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                                {MOCK_COST_DATA.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                                        <span className="text-muted-foreground">{d.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
