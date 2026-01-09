// src/app/dashboard/reports/editor/[id]/page.tsx
"use client";

import React, { use, useEffect, useState } from 'react';
import { ReportEditor } from '@/components/reporting/ReportEditor';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        async function loadReport() {
            try {
                // 1. Resolve Region
                let region = user?.region;
                if (!region || region === 'default') {
                    const rRef = doc(globalDb, 'user_routing', user?.uid || 'unknown');
                    const rSnap = await getDoc(rRef);
                    region = rSnap.exists() ? rSnap.data().region : 'uk';
                }

                const db = getRegionalDb(region);
                const reportRef = doc(db, 'reports', id);
                const reportSnap = await getDoc(reportRef);

                if (reportSnap.exists()) {
                    setReport({ id: reportSnap.id, ...reportSnap.data() });
                } else {
                    toast({ variant: "destructive", title: "Not Found", description: "Report does not exist." });
                }
            } catch (e) {
                console.error(e);
                toast({ variant: "destructive", title: "Error", description: "Failed to load report." });
            } finally {
                setLoading(false);
            }
        }
        loadReport();
    }, [user, id, toast]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!report) return <div>Report not found</div>;

    return (
        <ReportEditor 
            reportId={id}
            tenantId={user?.tenantId || 'default'}
            studentId={report.studentId}
            initialContent={report.content}
            userId={user?.uid || 'unknown'}
        />
    );
}
