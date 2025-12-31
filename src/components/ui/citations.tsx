"use client";

import { KnowledgeChunk, KnowledgeDocument } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, BookOpen, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SearchResult {
    chunk: KnowledgeChunk;
    document?: KnowledgeDocument;
    score: number;
}

interface CitationsProps {
    citations: SearchResult[];
}

export function Citations({ citations }: CitationsProps) {
    const [expanded, setExpanded] = useState<string | null>(null);

    if (citations.length === 0) return null;

    return (
        <div className="space-y-4 mt-6 border-t pt-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Evidence References
            </h4>
            <div className="grid gap-3">
                {citations.map((cite, idx) => {
                    const isEvidence = cite.document?.type === 'evidence';
                    const trustScore = cite.document?.metadata.trustScore || 0;
                    
                    return (
                        <Card key={idx} className={`border-l-4 ${isEvidence ? 'border-l-green-500' : 'border-l-slate-300'}`}>
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm line-clamp-1">{cite.document?.title || "Unknown Source"}</span>
                                            {cite.document?.metadata.verified && (
                                                <Badge variant="outline" className="text-[10px] text-green-700 bg-green-50 border-green-200 px-1 py-0 h-5">
                                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                                </Badge>
                                            )}
                                            {isEvidence && (
                                                <Badge variant="secondary" className="text-[10px] h-5">{cite.document?.metadata.evidenceType}</Badge>
                                            )}
                                        </div>
                                        
                                        {/* Trust Score Bar */}
                                        {isEvidence && (
                                            <div className="flex items-center gap-2 w-32 mb-2">
                                                <Progress value={trustScore} className="h-1.5" />
                                                <span className="text-[10px] text-muted-foreground">{trustScore}%</span>
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            "{cite.chunk.content}"
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-2" onClick={() => setExpanded(expanded === cite.chunk.id ? null : cite.chunk.id)}>
                                        {expanded === cite.chunk.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {expanded === cite.chunk.id && (
                                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                                        <p className="italic mb-2">"{cite.chunk.content}"</p>
                                        <div className="flex gap-4">
                                            <span><strong>Type:</strong> {cite.document?.type}</span>
                                            {cite.document?.metadata.publicationYear && <span><strong>Year:</strong> {cite.document?.metadata.publicationYear}</span>}
                                            {cite.document?.metadata.doiOrUrl && (
                                                <a href={cite.document?.metadata.doiOrUrl} target="_blank" className="flex items-center text-blue-600 hover:underline">
                                                    Source <ExternalLink className="h-3 w-3 ml-1" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
