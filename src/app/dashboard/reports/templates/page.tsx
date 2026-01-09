// src/app/dashboard/reports/templates/page.tsx

"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatutoryReportTemplate } from '@/marketplace/types';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function ReportTemplatesContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceSessionId = searchParams.get('sourceSessionId');
    const { toast } = useToast();

    const [templates, setTemplates] = useState<StatutoryReportTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        async function fetchTemplates() {
            const tenantId = user?.tenantId || 'default';
            try {
                const ref = doc(db, `tenants/${tenantId}/settings/reporting`);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().templates) {
                    setTemplates(snap.data().templates);
                } else {
                    // Mock for Pilot
                    setTemplates([
                        { 
                            id: "custom_letter", 
                            name: "Professional Letter", 
                            sections: [{ id: "body", title: "Content", promptId: "letter_body" }],
                            constraints: []
                        },
                        {
                            id: "meeting_minutes",
                            name: "Meeting Minutes",
                            sections: [{ id: "notes", title: "Notes", promptId: "minutes" }],
                            constraints: []
                        }
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, [user]);

    const handleSelect = (templateId: string) => {
        // Redirect to Builder with template pre-selected
        // If sourceSessionId exists, pass it along
        const url = `/dashboard/reports/builder?templateId=${templateId}${sourceSessionId ? `&sourceSessionId=${sourceSessionId}` : ''}`;
        router.push(url);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Report Templates</h1>
                <p className="text-muted-foreground">Select a template to begin drafting.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <Card key={t.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelect(t.id)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                    {t.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">{t.sections.length} Sections</p>
                                    <div className="flex flex-wrap gap-2">
                                        {t.constraints?.map(c => (
                                            <Badge key={c} variant="secondary" className="text-[10px] uppercase">
                                                {c.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50 pt-4">
                                <Button variant="ghost" className="w-full justify-between">
                                    Use Template <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ReportTemplatesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-indigo-600"/></div>}>
            <ReportTemplatesContent />
        </Suspense>
    );
}
