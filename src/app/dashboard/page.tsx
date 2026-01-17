// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Loader2, LayoutDashboard, Shield } from 'lucide-react';

// Components
import { WelcomeHeader } from '@/components/dashboard/widgets/WelcomeHeader';
import { StatsOverview } from '@/components/dashboard/widgets/StatsOverview';
import { ActiveCaseList, CaseSummary } from '@/components/dashboard/ActiveCaseList';
import { GuardianDashboard } from '@/components/guardian/GuardianDashboard';
import { DashboardSchedule } from '@/components/dashboard/widgets/DashboardSchedule';
import { ComplianceWidget } from '@/components/dashboard/widgets/ComplianceWidget';
import { DistrictReport } from '@/types/analytics'; 

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [cases, setCases] = useState<CaseSummary[]>([]);
    const [stats, setStats] = useState({
        activeCases: 0,
        draftReports: 0,
        upcomingDeadlines: 0,
        breachRisks: 0
    });
    const [adminReport, setAdminReport] = useState<DistrictReport | null>(null);
    const [viewMode, setViewMode] = useState<'clinician' | 'admin'>('clinician');
    const [dataLoading, setDataLoading] = useState(true);

    // 1. Auth Guard
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // 2. Data Fetching
    useEffect(() => {
        const loadDashboard = async () => {
            if (!user) return;

            try {
                let region = user.region || 'uk';
                if (user.uid && !user.region) {
                     const rDoc = await getDoc(doc(globalDb, 'user_routing', user.uid));
                     if (rDoc.exists()) region = rDoc.data().region || 'uk';
                }
                const db = await getRegionalDb(region);
                console.log(`[Dashboard] Loading from shard: ${region}`);

                // Fetch Cases
                let qCases;
                if (user.tenantId && user.tenantId !== 'default') {
                    qCases = query(
                        collection(db, 'cases'),
                        where('tenantId', '==', user.tenantId),
                        where('status', '!=', 'archived'),
                        orderBy('updatedAt', 'desc'),
                        limit(50)
                    );
                } else {
                    qCases = query(collection(db, 'cases'), limit(20));
                }

                const caseSnaps = await getDocs(qCases);
                const loadedCases: CaseSummary[] = caseSnaps.docs.map(d => {
                    const data = d.data();
                    const reqDate = data.statutoryTimeline?.requestDate ? new Date(data.statutoryTimeline.requestDate) : new Date();
                    const weeks = Math.floor((Date.now() - reqDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    
                    return {
                        id: d.id,
                        studentName: data.studentName || data.title || 'Unnamed',
                        upn: data.upn || 'N/A',
                        status: data.status || 'active',
                        currentWeek: weeks > 0 ? weeks : 0,
                        isOverdue: data.statutoryTimeline?.isOverdue || false,
                        nextAction: 'Review File'
                    };
                });

                setCases(loadedCases);

                // Stats Calculation
                const overdueCount = loadedCases.filter(c => c.isOverdue).length;
                
                setStats({
                    activeCases: loadedCases.length,
                    draftReports: 0, // In prod: fetch count
                    upcomingDeadlines: loadedCases.filter(c => c.currentWeek > 18).length,
                    breachRisks: overdueCount
                });

                // Admin View Logic
                if (user.role === 'SuperAdmin' || user.role?.includes('Admin')) {
                    setAdminReport({
                        generatedAt: new Date().toISOString(),
                        totalActiveCases: loadedCases.length,
                        breachProjections: overdueCount,
                        topNeeds: { 'Autism': 10, 'SEMH': 5 },
                        activeAlerts: [] 
                    });
                    // Don't auto-switch, allow user to toggle
                }

            } catch (e) {
                console.error("Dashboard Load Failed:", e);
            } finally {
                setDataLoading(false);
            }
        };

        if (user) loadDashboard();
    }, [user]);

    if (loading || (user && dataLoading)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                
                {/* 1. Header & Context Switcher */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <WelcomeHeader />
                    
                    {adminReport && (
                        <div className="bg-white p-1 rounded-lg border shadow-sm inline-flex">
                            <button 
                                onClick={() => setViewMode('clinician')}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'clinician' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                My Caseload
                            </button>
                            <button 
                                onClick={() => setViewMode('admin')}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'admin' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                <Shield className="w-4 h-4" />
                                Admin / Guardian
                            </button>
                        </div>
                    )}
                </div>

                {viewMode === 'clinician' ? (
                    <>
                        {/* 2. Key Metrics */}
                        <StatsOverview stats={stats} />

                        {/* 3. Main Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Column: Active Cases (2/3 Width) */}
                            <div className="lg:col-span-2 space-y-8">
                                <ActiveCaseList cases={cases} />
                            </div>

                            {/* Right Column: Widgets (1/3 Width) */}
                            <div className="space-y-6">
                                {/* Schedule Widget */}
                                <DashboardSchedule />
                                
                                {/* Compliance / Alerts Widget */}
                                <ComplianceWidget />
                            </div>
                        </div>
                    </>
                ) : (
                    // Admin View
                    adminReport && <GuardianDashboard report={adminReport} />
                )}
            </div>
        </div>
    );
}
