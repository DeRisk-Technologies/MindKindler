"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActiveCaseList, CaseSummary } from '@/components/dashboard/ActiveCaseList';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase'; // Assuming we have this helper or access to db

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [cases, setCases] = useState<CaseSummary[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchCases = async () => {
            if (!user) return;

            try {
                // Determine which DB to query (Regional Shard)
                const db = await getRegionalDb(user.region || 'uk');
                const casesRef = collection(db, 'cases');
                
                // Query: Active cases for this tenant
                const q = query(
                    casesRef, 
                    where('tenantId', '==', user.tenantId),
                    where('status', '!=', 'archived')
                );

                const snapshot = await getDocs(q);
                
                const loadedCases: CaseSummary[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Basic mapping, assuming schema match or providing defaults
                    return {
                        id: doc.id,
                        studentName: data.studentName || 'Unknown Student',
                        upn: data.upn || 'No UPN',
                        status: data.status || 'assessment',
                        currentWeek: calculateWeek(data.statutoryTimeline?.requestDate),
                        isOverdue: data.statutoryTimeline?.isOverdue || false,
                        nextAction: 'Review file' // Placeholder logic
                    };
                });

                setCases(loadedCases);
            } catch (err) {
                console.error("Failed to fetch cases:", err);
            } finally {
                setDataLoading(false);
            }
        };

        if (user) {
            fetchCases();
        }
    }, [user]);

    // Helper for week calculation
    const calculateWeek = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = Date.now() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    };

    if (loading || (user && dataLoading)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <div className="space-y-6">
            <ActiveCaseList cases={cases} />
        </div>
    );
}
