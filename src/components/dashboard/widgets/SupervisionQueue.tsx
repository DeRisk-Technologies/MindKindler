// src/components/dashboard/widgets/SupervisionQueue.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export function SupervisionQueue() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchQueue() {
            try {
                // 1. Resolve Region
                let region = user?.region;
                if (!region || region === 'default') {
                    const rRef = doc(globalDb, 'user_routing', user?.uid || 'unknown');
                    const rSnap = await getDoc(rRef);
                    region = rSnap.exists() ? rSnap.data().region : 'uk';
                }
                const db = getRegionalDb(region);

                // 2. Fetch Pending Reports assigned to this User (Supervisor)
                // Note: In real app, ensure 'supervisorId' is indexed
                const q = query(
                    collection(db, 'reports'),
                    where('supervisorId', '==', user?.uid),
                    where('status', '==', 'pending_review'),
                    orderBy('updatedAt', 'desc')
                );

                const snapshot = await getDocs(q);
                setQueue(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (e) {
                console.error("Failed to load supervision queue", e);
            } finally {
                setLoading(false);
            }
        }
        fetchQueue();
    }, [user]);

    return (
        <Card className="h-full border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                    <UserCheck className="h-5 w-5 text-amber-600" />
                    Supervision Queue
                </CardTitle>
                <CardDescription>Reports awaiting your sign-off</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-xs text-slate-400">Loading...</div>
                ) : queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
                        <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                        All clear. No pending reviews.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map(report => (
                            <div key={report.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm group hover:border-amber-300 transition-all">
                                <div>
                                    <div className="font-semibold text-sm text-slate-800">{report.title || "Untitled"}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> 
                                        Submitted: {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'Recent'}
                                    </div>
                                    <div className="mt-1">
                                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                                            For Review
                                        </Badge>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" asChild className="group-hover:bg-amber-50 group-hover:text-amber-700">
                                    <Link href={`/dashboard/reports/review/${report.id}`}>
                                        Review <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
