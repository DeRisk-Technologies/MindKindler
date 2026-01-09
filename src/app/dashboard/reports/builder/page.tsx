// src/app/dashboard/reports/builder/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'; 
import { db, functions, getRegionalDb } from '@/lib/firebase';
import { StatutoryReportTemplate } from '@/marketplace/types';
import { Loader2, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useRouter } from 'next/navigation';

// FALLBACK UK TEMPLATES (If Pack Installer not run)
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

export default function ReportBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Config
    const [templates, setTemplates] = useState<StatutoryReportTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    // Fetch Students for Dropdown
    const { data: students } = useFirestoreCollection('students', 'lastName', 'asc');

    const activeTemplate = templates.find(t => t.id === selectedTemplateId);

    // Fetch Installed Templates (e.g. UK EHCP)
    useEffect(() => {
        if (!user) return;
        
        async function fetchTemplates() {
            let loadedTemplates: StatutoryReportTemplate[] = [];
            const tenantId = user?.tenantId || 'default';

            try {
                // 1. Try fetching installed pack from tenant settings
                const ref = doc(db, `tenants/${tenantId}/settings/reporting`);
                const snap = await getDoc(ref);
                
                if (snap.exists() && snap.data().templates) {
                    loadedTemplates = snap.data().templates;
                } else {
                    // 2. FALLBACK: Use hardcoded UK Templates for Pilot if UK user
                    // FIX: Safe null check for user
                    const isUK = user?.region === 'uk' || user?.email?.includes('uk');
                    
                    if (isUK) {
                        loadedTemplates = FALLBACK_UK_TEMPLATES;
                    }
                }
                setTemplates(loadedTemplates);
            } catch (e) {
                console.error("Failed to load templates", e);
                setTemplates(FALLBACK_UK_TEMPLATES);
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, [user]);

    const handleGenerate = async () => {
        if (!selectedTemplateId || !selectedStudentId || !activeTemplate || !user) {
            toast({ title: "Validation", description: "Please select both a student and a template.", variant: "destructive" });
            return;
        }
        setGenerating(true);

        try {
            // 1. Call Cloud Function to Generate Content
            const generateFn = httpsCallable(functions, 'generateClinicalReport');
            
            const result = await generateFn({
                tenantId: user?.tenantId,
                studentId: selectedStudentId,
                templateId: selectedTemplateId,
                // Pass the context pack ID to trigger RAG constraints
                contextPackId: 'uk_la_pack' 
            });

            const responseData = result.data as any;
            
            // 2. Resolve Regional DB
            // Pilot fallback: infer region if missing
            // FIX: Added optional chaining to user access
            const region = user?.region || (user?.email?.includes('uk') ? 'uk' : 'default');
            const targetDb = getRegionalDb(region);

            // 3. Get Student Name for Metadata
            const studentName = students.find(s => s.id === selectedStudentId)?.firstName + ' ' + students.find(s => s.id === selectedStudentId)?.lastName;

            // 4. Save to Firestore (Regional 'reports' collection)
            const newReport = {
                title: activeTemplate.name + ' - Draft',
                templateId: selectedTemplateId,
                studentId: selectedStudentId,
                studentName: studentName || 'Unknown Student',
                status: 'draft',
                createdAt: new Date().toISOString(), // Use ISO string for client compat
                updatedAt: new Date().toISOString(),
                createdBy: user.uid,
                content: responseData.content || {}, // The AI generated sections
                summary: responseData.summary || "",
                type: 'statutory'
            };

            const reportRef = await addDoc(collection(targetDb, 'reports'), newReport);

            toast({
                title: "Draft Saved",
                description: "Report generated and saved to regional database.",
            });

            // 5. Redirect to Editor
            router.push(`/dashboard/reports/editor/${reportRef.id}`);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Generation Failed",
                description: "Error: " + error.message,
                variant: "destructive"
            });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statutory Report Writer</h1>
                    <p className="text-muted-foreground">
                        Generate compliant drafts using the installed Country Pack templates.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Student Selector */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Select Student</label>
                            {/* Standard Select to avoid recursion errors */}
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="" disabled>Select Student...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.firstName} {s.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Template Selector */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Select Template</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="" disabled>Choose a statutory framework...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* RAG Constraints Visualization */}
                        {activeTemplate && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-5 w-5 text-amber-700" />
                                    <h3 className="font-semibold text-amber-800">Compliance Mode Active</h3>
                                </div>
                                <p className="text-sm text-amber-700 mb-3">
                                    The AI Guardian will enforce the following statutory constraints for this report:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeTemplate.constraints?.map(c => (
                                        <Badge key={c} variant="outline" className="bg-white text-amber-800 border-amber-300 capitalize">
                                            {c.replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTemplate && (
                            <div className="grid gap-2 border rounded p-4 bg-slate-50">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Sections to Generate
                                </h4>
                                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                    {activeTemplate.sections.map(s => (
                                        <li key={s.id}>{s.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-slate-50 p-4">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={!selectedTemplateId || !selectedStudentId || generating} 
                            className="w-[200px]"
                        >
                            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {generating ? 'Drafting...' : 'Generate Draft'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
