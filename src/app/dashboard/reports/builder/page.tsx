// src/app/dashboard/reports/builder/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { StatutoryReportTemplate } from '@/marketplace/types';
import { Loader2, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';

export default function ReportBuilderPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Config
    const [templates, setTemplates] = useState<StatutoryReportTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('student-123'); // Mock selection

    const activeTemplate = templates.find(t => t.id === selectedTemplateId);

    // Fetch Installed Templates (e.g. UK EHCP)
    useEffect(() => {
        if (!user?.tenantId) return;
        async function fetchTemplates() {
            try {
                const ref = doc(db, `tenants/${user?.tenantId}/settings/reporting`);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setTemplates(snap.data().templates || []);
                }
            } catch (e) {
                console.error("Failed to load templates", e);
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, [user?.tenantId]);

    const handleGenerate = async () => {
        if (!selectedTemplateId || !activeTemplate) return;
        setGenerating(true);

        try {
            // Call the Cloud Function we hooked up in Phase 4
            const generateFn = httpsCallable(functions, 'generateClinicalReport');
            
            await generateFn({
                tenantId: user?.tenantId,
                studentId: selectedStudentId,
                templateId: selectedTemplateId,
                // Pass the context pack ID to trigger RAG constraints
                // In a real app, we'd look this up from installed_packs, 
                // but for MVP we infer it or pass it explicitly if known.
                contextPackId: 'uk_la_pack' 
            });

            toast({
                title: "Draft Generated",
                description: "The AI has drafted the report adhering to statutory constraints.",
            });

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Generation Failed",
                description: error.message,
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
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Select Template</label>
                            <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a statutory framework..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.length === 0 && (
                                        <SelectItem value="none" disabled>No templates installed (Run Installer)</SelectItem>
                                    )}
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* RAG Constraints Visualization (Research Section 4.2.2) */}
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
                                    {(!activeTemplate.constraints || activeTemplate.constraints.length === 0) && (
                                        <span className="text-xs text-muted-foreground">No specific constraints defined.</span>
                                    )}
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
                            disabled={!selectedTemplateId || generating} 
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
