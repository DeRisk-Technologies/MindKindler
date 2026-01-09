// src/app/dashboard/reports/builder/page.tsx

"use client";

import React, { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore'; 
import { db, functions, getRegionalDb, db as globalDb } from '@/lib/firebase';
import { StatutoryReportTemplate } from '@/marketplace/types';
import { Loader2, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useRouter, useSearchParams } from 'next/navigation'; 

// FALLBACK UK TEMPLATES
const FALLBACK_UK_TEMPLATES: StatutoryReportTemplate[] = [
    {
        id: "ehcp_needs_assessment",
        name: "EHCP Needs Assessment (Section F)",
        sections: [
          { id: "section_a", title: "Section A: Views of Child", promptId: "ehcp_sec_a" },
          { id: "section_b", title: "Section B: Special Educational Needs", promptId: "ehcp_sec_b" },
          { id: "section_f", title: "Section F: Provision", promptId: "ehcp_sec_f" }
        ],
        constraints: ["no_medical_diagnosis", "use_tentative_language"]
    },
    {
        id: "early_years_inclusion",
        name: "Early Years Inclusion Fund (EYIF)",
        sections: [
            { id: "strengths", title: "Strengths & Interests", promptId: "eyif_strengths" },
            { id: "impact", title: "Impact on Development", promptId: "eyif_impact" }
        ],
        constraints: ["eyfs_framework_alignment"]
    }
];

function ReportBuilderContent() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams(); 
    
    const sourceSessionId = searchParams.get('sourceSessionId');
    const paramTemplateId = searchParams.get('templateId');

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [justFinished, setJustFinished] = useState(false);
    
    const [templates, setTemplates] = useState<StatutoryReportTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(paramTemplateId || '');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    const { data: students } = useFirestoreCollection('students', 'lastName', 'asc');
    const activeTemplate = templates.find(t => t.id === selectedTemplateId);

    // --- 1. Fetch Templates & Pre-fill ---
    useEffect(() => {
        if (!user) return;
        
        async function init() {
            // A. Resolve Region
            let region = user?.region;
            if (!region || region === 'default') {
                if (user?.uid) {
                    const routingRef = doc(globalDb, 'user_routing', user.uid);
                    const routingSnap = await getDoc(routingRef);
                    region = routingSnap.exists() ? routingSnap.data().region : 'uk';
                } else {
                    region = 'uk';
                }
            }
            const targetDb = getRegionalDb(region);

            // B. Load Templates
            const tenantId = user?.tenantId || 'default';
            try {
                const ref = doc(db, `tenants/${tenantId}/settings/reporting`);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().templates) {
                    setTemplates(snap.data().templates);
                } else if (region === 'uk' || user?.email?.includes('uk')) {
                    setTemplates(FALLBACK_UK_TEMPLATES);
                }
            } catch (e) {
                setTemplates(FALLBACK_UK_TEMPLATES);
            }

            // C. If sourceSessionId, load Session
            if (sourceSessionId) {
                try {
                    const sessionSnap = await getDoc(doc(targetDb, 'consultation_sessions', sourceSessionId));
                    if (sessionSnap.exists()) {
                        const sData = sessionSnap.data();
                        if (sData.studentId) {
                            setSelectedStudentId(sData.studentId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load session linkage", e);
                }
            }
            
            setLoading(false);
        }
        init();
    }, [user, sourceSessionId]);

    const handleGenerate = async () => {
        if (!selectedTemplateId || !selectedStudentId || !activeTemplate || !user) return;
        setGenerating(true);

        try {
            // 1. Resolve Region
            let region = user?.region; 
            if (!region || region === 'default') {
                if (user?.uid) {
                    const routingRef = doc(globalDb, 'user_routing', user.uid);
                    const routingSnap = await getDoc(routingRef);
                    region = routingSnap.exists() ? routingSnap.data().region : 'uk';
                } else {
                    region = 'uk';
                }
            }
            const targetDb = getRegionalDb(region);

            // 2. Fetch Full Student Data
            const studentRef = doc(targetDb, 'students', selectedStudentId);
            const studentSnap = await getDoc(studentRef);
            
            if (!studentSnap.exists()) {
                throw new Error("Student record not found in regional database.");
            }
            
            // Sanitize
            const plainStudentContext = JSON.parse(JSON.stringify(studentSnap.data()));

            // 3. Fetch Session Data (if applicable)
            let sessionContext = {};
            if (sourceSessionId) {
                const sessionSnap = await getDoc(doc(targetDb, 'consultation_sessions', sourceSessionId));
                if (sessionSnap.exists()) {
                    sessionContext = JSON.parse(JSON.stringify(sessionSnap.data()));
                }
            }

            console.log("[Builder] Sending Context to AI:", { student: plainStudentContext, session: sessionContext });

            // 4. AI Generation
            const generateFn = httpsCallable(functions, 'generateClinicalReport');
            const result = await generateFn({
                tenantId: user?.tenantId,
                studentId: selectedStudentId,
                templateId: selectedTemplateId,
                contextPackId: 'uk_la_pack',
                studentContext: plainStudentContext,
                sessionContext: sessionContext       
            });

            const responseData = result.data as any;
            
            // 5. Persistence
            const newReport = {
                title: activeTemplate.name + ' - Draft',
                templateId: selectedTemplateId,
                studentId: selectedStudentId,
                sessionId: sourceSessionId || null, 
                studentName: plainStudentContext.identity?.firstName?.value + ' ' + plainStudentContext.identity?.lastName?.value || 'Unknown Student',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.uid, 
                content: responseData.sections || responseData.content || [], 
                summary: responseData.summary || "",
                type: 'statutory'
            };

            const reportRef = await addDoc(collection(targetDb, 'reports'), newReport);

            setJustFinished(true);
            toast({ title: "Draft Created", description: "Report generated from session evidence." });

            setTimeout(() => {
                router.push(`/dashboard/reports/editor/${reportRef.id}`);
            }, 800);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Failed", description: error.message, variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    if (justFinished) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
                <h2 className="text-xl font-bold">Draft Generated!</h2>
                <p className="text-slate-500">Opening editor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statutory Report Writer</h1>
                    <p className="text-muted-foreground">Generate compliant drafts using Country Pack templates.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <Card>
                    <CardHeader><CardTitle className="text-lg">Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Select Student</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                disabled={!!sourceSessionId} 
                            >
                                <option value="" disabled>Select Student...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                            {sourceSessionId && <p className="text-xs text-muted-foreground">Locked to current session context.</p>}
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Select Template</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="" disabled>Choose a framework...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {activeTemplate && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-5 w-5 text-amber-700" />
                                    <h3 className="font-semibold text-amber-800">Compliance Mode: Gemini 2.0 Flash</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {activeTemplate.constraints?.map(c => (
                                        <Badge key={c} variant="outline" className="bg-white text-amber-800 border-amber-300 capitalize">
                                            {c.replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-slate-50 p-4">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={!selectedTemplateId || !selectedStudentId || generating} 
                            className="w-[200px] bg-indigo-600 hover:bg-indigo-700"
                        >
                            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting...</> : 'Generate Draft'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

// Wrapper to satisfy Next.js Suspense requirement for useSearchParams
export default function ReportBuilderPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-indigo-600"/></div>}>
            <ReportBuilderContent />
        </Suspense>
    );
}
