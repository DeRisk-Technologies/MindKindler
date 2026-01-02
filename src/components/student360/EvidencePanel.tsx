// src/components/student360/EvidencePanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, ExternalLink, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface EvidenceDoc {
    id: string;
    title: string;
    type: string;
    date: string;
    trustScore: number;
    url?: string;
    consentRequired?: boolean; // New field
}

interface EvidencePanelProps {
    documents: EvidenceDoc[];
    onViewDocument: (doc: EvidenceDoc) => void;
}

export function EvidencePanel({ documents, onViewDocument }: EvidencePanelProps) {
    const { t } = useTranslation();

    return (
        <Card className="h-full flex flex-col" role="region" aria-label={t('student360.evidence.title')}>
            <CardHeader className="py-3 bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4 text-indigo-600" aria-hidden="true" />
                    {t('student360.evidence.title')}
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="p-0">
                    {documents.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground">{t('student360.evidence.noEvidence')}</div>
                    )}
                    {documents.map((doc) => (
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
                                onClick={() => onViewDocument(doc)}
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
