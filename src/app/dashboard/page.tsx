// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Components
import { WelcomeHeader } from '@/components/dashboard/widgets/WelcomeHeader';
import { StatsOverview } from '@/components/dashboard/widgets/StatsOverview';
import { ActiveCaseList, CaseSummary } from '@/components/dashboard/ActiveCaseList';
import { GuardianDashboard } from '@/components/guardian/GuardianDashboard'; // Reuse if admin
import { DistrictReport } from '@/types/analytics'; // For Guardian

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    // State
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

    // 2. Data Fetching Strategy (Robust & Regional)
    useEffect(() => {
        const loadDashboard = async () => {
            if (!user) return;

            try {
                // A. Resolve Database (Handle Default vs Shard)
                let region = user.region || 'uk';
                if (user.uid && !user.region) {
                     // Fallback check on routing doc if claims failed
                     const rDoc = await getDoc(doc(globalDb, 'user_routing', user.uid));
                     if (rDoc.exists()) region = rDoc.data().region || 'uk';
                }
                const db = await getRegionalDb(region);
                console.log(`[Dashboard] Loading from shard: ${region} for tenant: ${user.tenantId}`);

                // B. Fetch Cases (Scoped to Tenant)
                // Note: We use a loose query first to ensure we get data, then filter if needed
                // Ideally: where('tenantId', '==', user.tenantId)
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
                    // Fallback for admins/test users without strict tenant
                    qCases = query(collection(db, 'cases'), limit(20));
                }

                const caseSnaps = await getDocs(qCases);
                const loadedCases: CaseSummary[] = caseSnaps.docs.map(d => {
                    const data = d.data();
                    // Calc Timeline
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

                // C. Fetch Reports Stats (Parallel)
                let draftCount = 0;
                // Simple hack: check 'drafts' collection if it exists, or 'reports' where status=draft
                // Assuming 'reports' collection per our fix
                // We won't do a full count query for perf, just estimate or skip for pilot
                
                // D. Calculate Aggregate Stats
                const overdueCount = loadedCases.filter(c => c.isOverdue).length;
                
                setStats({
                    activeCases: loadedCases.length,
                    draftReports: 0, // Placeholder
                    upcomingDeadlines: loadedCases.filter(c => c.currentWeek > 18).length, // Near end
                    breachRisks: overdueCount
                });

                // E. If Admin, Load Guardian Data
                if (user.role === 'SuperAdmin' || user.role?.includes('Admin')) {
                    // Fetch alerts from 'analytics_alerts' collection if it exists
                    // For now, mock the Admin Report to prevent 404 block
                    setAdminReport({
                        generatedAt: new Date().toISOString(),
                        totalActiveCases: loadedCases.length,
                        breachProjections: overdueCount,
                        topNeeds: { 'Autism': 10, 'SEMH': 5 },
                        activeAlerts: [] // Populate if you have alerts
                    });
                    setViewMode('admin'); // Default to admin view if admin
                } else {
                    setViewMode('clinician');
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
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* 1. Universal Header */}
            <WelcomeHeader />

            {/* 2. Key Metrics (Role Agnostic) */}
            <StatsOverview stats={stats} />

            {/* 3. Main Workspace Switcher (If Admin) */}
            {adminReport && (
                <div className="flex justify-end">
                    <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                        <button 
                            onClick={() => setViewMode('clinician')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'clinician' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            My Caseload
                        </button>
                        <button 
                            onClick={() => setViewMode('admin')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'admin' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            District Intelligence
                        </button>
                    </div>
                </div>
            )}

            {/* 4. The View */}
            {viewMode === 'clinician' ? (
                <ActiveCaseList cases={cases} />
            ) : (
                adminReport && <GuardianDashboard report={adminReport} />
            )}
        </div>
    );
}
