// src/components/student360/EvidencePanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, ExternalLink, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { useEffect, useState } from "react";

export interface EvidenceDoc {
    id: string;
    title: string;
    type: string;
    date: string;
    trustScore: number;
    url?: string;
    consentRequired?: boolean;
}

interface EvidencePanelProps {
    documents?: EvidenceDoc[]; // Optional now
    studentId?: string;       // Added for smart fetching
    onViewDocument?: (doc: EvidenceDoc) => void;
}

export function EvidencePanel({ documents: initialDocs, studentId, onViewDocument }: EvidencePanelProps) {
    const { t } = useTranslation();
    const [docs, setDocs] = useState<EvidenceDoc[]>(initialDocs || []);
    
    // Fetch if studentId provided
    const { data: fetchedDocs, loading } = useFirestoreCollection(
        'uploaded_documents', 
        'createdAt', 
        'desc', 
        studentId ? { filter: { field: 'studentId', operator: '==', value: studentId } } : undefined
    );

    useEffect(() => {
        if (fetchedDocs && studentId) {
            // Map Firestore data to EvidenceDoc interface
            const mapped = fetchedDocs.map((d: any) => ({
                id: d.id,
                title: d.fileName || d.title || 'Untitled',
                type: d.fileType || 'document',
                date: d.createdAt || new Date().toISOString(),
                trustScore: d.trustScore || 0.5,
                url: d.url,
                consentRequired: d.classification === 'restricted'
            }));
            setDocs(mapped);
        }
    }, [fetchedDocs, studentId]);

    const handleView = (doc: EvidenceDoc) => {
        if (onViewDocument) {
            onViewDocument(doc);
        } else if (doc.url) {
            window.open(doc.url, '_blank');
        } else {
            console.log("No URL for doc", doc);
        }
    };

    return (
        <Card className="h-full flex flex-col" role="region" aria-label={t('student360.evidence.title')}>
            <CardHeader className="py-3 bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4 text-indigo-600" aria-hidden="true" />
                        {t('student360.evidence.title')}
                    </div>
                    {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="p-0">
                    {!loading && docs.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground">{t('student360.evidence.noEvidence')}</div>
                    )}
                    {docs.map((doc) => (
                        <div key={doc.id} className="p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex justify-between items-center group">
                            <div className="flex items-start gap-3 overflow-hidden">
                                <div className="bg-slate-100 p-2 rounded text-slate-500" aria-hidden="true">
                                    <File className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium truncate flex items-center gap-2">
                                        {doc.title}
                                        {doc.consentRequired && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Lock className="h-3 w-3 text-amber-500" aria-label="Consent Required" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Parental consent required to view</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </p>
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>{new Date(doc.date).toLocaleDateString()}</span>
                                        <span aria-hidden="true">•</span>
                                        <span className={doc.trustScore > 0.8 ? "text-green-600" : "text-amber-600"}>
                                            {t('student360.evidence.trust')}: {(doc.trustScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" 
                                onClick={() => handleView(doc)}
                                aria-label={`${t('student360.actions.viewDoc')} ${doc.title}`}
                            >
                                <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
