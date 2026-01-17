// src/app/dashboard/reports/builder/page.tsx

"use client";

import React, { useEffect, useState, Suspense } from 'react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore'; 
import { db, functions, getRegionalDb, db as globalDb } from '@/lib/firebase';
import { StatutoryReportTemplate } from '@/marketplace/types';
import { Loader2, FileText, ShieldCheck, CheckCircle2, LockKeyhole } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useCompliance } from "@/hooks/use-compliance";
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { UK_EPP_TEMPLATES } from '@/config/report-templates';

// Props Interface for Reusability
export interface ReportBuilderProps {
    sourceSessionId?: string | null;
    preselectedStudentId?: string;
    preselectedTemplateId?: string;
    caseId?: string; // Link to case
}

export function ReportBuilder({ 
    sourceSessionId, 
    preselectedStudentId, 
    preselectedTemplateId,
    caseId 
}: ReportBuilderProps) {
    const { user, userProfile } = useAuth(); 
    const router = useRouter();
    const { toast } = useToast();
    const { checkConsent } = useCompliance();
    
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [justFinished, setJustFinished] = useState(false);
    const [complianceError, setComplianceError] = useState<string | null>(null);
    
    const [templates, setTemplates] = useState<StatutoryReportTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(preselectedTemplateId || '');
    const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');

    const { data: students } = useFirestoreCollection('students', 'lastName', 'asc');
    const activeTemplate = templates.find(t => t.id === selectedTemplateId);

    // --- 1. Fetch Templates & Pre-fill ---
    useEffect(() => {
        if (!user) return;
        
        async function init() {
            // A. Resolve Region
            let region = userProfile?.metadata?.region || 'uk';
            const targetDb = getRegionalDb(region);

            // B. Load Templates
            const tenantId = userProfile?.tenantId || 'default';
            try {
                const ref = doc(db, `tenants/${tenantId}/settings/reporting`);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().templates) {
                    setTemplates(snap.data().templates);
                } else {
                    setTemplates(UK_EPP_TEMPLATES);
                }
            } catch (e) {
                setTemplates(UK_EPP_TEMPLATES);
            }

            // C. If sourceSessionId, load Session (if student not passed)
            if (sourceSessionId && !selectedStudentId) {
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
    }, [user, userProfile, sourceSessionId, selectedStudentId]);

    // --- PRIVACY HELPER: Redact PII before sending to AI ---
    const redactForAI = (student: any) => {
        if (!student) return {};
        
        let age = "Unknown";
        if (student.identity?.dateOfBirth?.value) {
            const dob = new Date(student.identity.dateOfBirth.value);
            const diff = Date.now() - dob.getTime();
            const ageDate = new Date(diff);
            age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
        }

        return {
            identity: {
                firstName: { value: student.identity?.firstName?.value || "Student" },
                lastName: { value: student.identity?.lastName?.value ? student.identity.lastName.value.charAt(0) + "." : "" },
                age: age, 
                gender: { value: student.identity?.gender?.value || "Not specified" }
            },
            education: {
                senStatus: { value: student.education?.senStatus?.value },
                yearGroup: { value: student.education?.yearGroup?.value }
            },
            health: {
                conditions: { value: student.health?.conditions?.value || [] }
            }
        };
    };

    const handleGenerate = async (forceOverride = false) => {
        if (!selectedTemplateId || !selectedStudentId || !activeTemplate || !user || !userProfile?.tenantId) {
             toast({ title: "Configuration Error", description: "Missing Tenant ID or Selection.", variant: "destructive" });
             return;
        }
        
        // --- COMPLIANCE GATE ---
        setGenerating(true);
        
        if (!forceOverride) {
            const compliance = await checkConsent(selectedStudentId);
            if (!compliance.allowed) {
                setComplianceError(compliance.reason || "Legal Consent Missing");
                setGenerating(false);
                return;
            }
        } else {
            console.log("Compliance Override Active: User certified manual consent.");
        }

        try {
            // 1. Resolve Region
            const region = userProfile?.metadata?.region || 'uk';
            const targetDb = getRegionalDb(region);
            const tenantId = userProfile.tenantId; 

            // 2. Fetch Full Student Data (Client Side)
            const studentRef = doc(targetDb, 'students', selectedStudentId);
            const studentSnap = await getDoc(studentRef);
            
            if (!studentSnap.exists()) {
                throw new Error("Student record not found in regional database.");
            }
            
            const rawStudentData = studentSnap.data();

            // 3. Fetch Session Data
            let sessionContext = {};
            if (sourceSessionId) {
                const sessionSnap = await getDoc(doc(targetDb, 'consultation_sessions', sourceSessionId));
                if (sessionSnap.exists()) {
                    sessionContext = JSON.parse(JSON.stringify(sessionSnap.data()));
                }
            }

            // 4. PRIVACY: Redact Context
            const redactedStudentContext = redactForAI(rawStudentData);
            
            console.log("[Builder] Sending REDACTED Context to AI:", { student: redactedStudentContext });

            // 5. AI Generation
            const generateFn = httpsCallable(functions, 'generateClinicalReport');
            const result = await generateFn({
                tenantId: tenantId,
                studentId: selectedStudentId,
                templateId: selectedTemplateId,
                contextPackId: 'uk_la_pack',
                studentContext: redactedStudentContext, 
                sessionContext: sessionContext       
            });

            const responseData = result.data as any;

            let contentToSave = responseData.sections || responseData.content || [];
            if (!contentToSave || contentToSave.length === 0) {
                 if (responseData.text || (responseData.parsed && responseData.parsed.text)) {
                     contentToSave = { 
                         sections: [
                             { 
                                 id: 'generated_content', 
                                 title: 'Generated Draft', 
                                 content: responseData.text || responseData.parsed.text 
                             }
                         ]
                     };
                 } else {
                     console.warn("AI returned empty content", responseData);
                 }
            }
            
            // 6. Persistence (Save with REAL Name for internal record)
            const realName = (rawStudentData.identity?.firstName?.value || '') + ' ' + (rawStudentData.identity?.lastName?.value || '');
            
            const newReport = {
                title: activeTemplate.name + ' - Draft',
                templateId: selectedTemplateId,
                studentId: selectedStudentId,
                caseId: caseId || null, 
                sessionId: sourceSessionId || null, 
                studentName: realName.trim() || 'Unknown Student',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid, 
                content: contentToSave, 
                summary: responseData.summary || "",
                type: 'statutory',
                tenantId: tenantId, 
                complianceOverride: forceOverride 
            };

            console.log(`[ReportService] Saving draft to DB. Region: ${region}, Tenant: ${tenantId}`);
            const reportRef = await addDoc(collection(targetDb, 'reports'), newReport);

            setJustFinished(true);
            toast({ title: "Draft Created", description: "Report generated (PII redacted during processing)." });

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
                                disabled={!!sourceSessionId || !!preselectedStudentId} 
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
                            onClick={() => handleGenerate(false)} 
                            disabled={!selectedTemplateId || !selectedStudentId || generating || !userProfile?.tenantId} 
                            className="w-[200px] bg-indigo-600 hover:bg-indigo-700"
                        >
                            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : 'Generate Draft'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* COMPLIANCE ALERT MODAL */}
            <AlertDialog open={!!complianceError} onOpenChange={() => setComplianceError(null)}>
                <AlertDialogContent className="border-l-4 border-l-red-500 max-w-lg">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 text-red-600">
                            <ShieldCheck className="h-6 w-6" />
                            <AlertDialogTitle>Compliance Block: Consent Required</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-slate-700">
                            <strong>{complianceError}.</strong><br/><br/>
                            You cannot generate a Statutory Advice draft until a parent or guardian has signed the legal consent form. This is to ensure GDPR and HIPAA compliance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <div className="flex-1 flex justify-start">
                            <Button 
                                variant="outline" 
                                className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                                onClick={() => {
                                    setComplianceError(null);
                                    handleGenerate(true);
                                }}
                            >
                                <LockKeyhole className="h-3 w-3 mr-1" />
                                Override (I have sighted consent)
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <AlertDialogCancel>Dismiss</AlertDialogCancel>
                            <AlertDialogAction 
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => router.push(`/dashboard/cases/new?studentId=${selectedStudentId}&tab=requests`)}
                            >
                                Send Request
                            </AlertDialogAction>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Wrapper to safely use useSearchParams inside Suspense
function ReportBuilderWrapper() {
    const searchParams = useSearchParams();
    return (
        <ReportBuilder 
            sourceSessionId={searchParams.get('sourceSessionId')} 
            preselectedTemplateId={searchParams.get('templateId') || undefined}
        />
    );
}

// Default Page Wrapper
export default function ReportBuilderPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-indigo-600"/></div>}>
            <ReportBuilderWrapper />
        </Suspense>
    );
}
