// src/components/reporting/CitationSidebar.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, GripVertical, Info, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { FormBuilder } from '@/components/dashboard/questionnaires/FormBuilder';

// Catalogs for Template Resolution
import UK_PACK from '@/marketplace/catalog/uk_la_pack.json';

interface EvidenceItem {
    id: string;
    type: 'observation' | 'assessment' | 'interview' | 'form';
    snippet: string;
    sourceDate: string;
    trustScore?: number;
    fullText?: string;
    // Form Specific
    templateId?: string;
    responses?: any; 
    respondentName?: string;
}

interface CitationSidebarProps {
    onInsert: (citationToken: string) => void;
    studentId?: string; // New Prop
    region?: string;    // New Prop
}

export function CitationSidebar({ onInsert, studentId, region = 'UK' }: CitationSidebarProps) {
    const [query, setQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

    // Fetch Digital Forms (Assessment Results)
    const { data: assessmentResults, loading } = useFirestoreCollection('assessment_results', 'completedAt', 'desc', {
        filter: studentId ? { field: 'studentId', operator: '==', value: studentId } : undefined
    });

    // Transform Results into Evidence Items
    const formEvidence: EvidenceItem[] = useMemo(() => {
        if (!assessmentResults) return [];
        return assessmentResults.map((res: any) => {
            // Find Template
            const template = UK_PACK.capabilities.digitalForms.find(t => t.id === res.templateId);
            const title = template?.title || res.templateId;
            
            // Map responses array to object if needed, or stick to what we have
            const responseMap = Array.isArray(res.responses) 
                ? res.responses.reduce((acc: any, curr: any) => ({ ...acc, [curr.questionId]: curr.answer }), {})
                : res.responses;

            return {
                id: res.id,
                type: 'form',
                snippet: `${title} (${res.status})`,
                sourceDate: res.completedAt ? new Date(res.completedAt).toLocaleDateString() : 'Unknown',
                trustScore: 1.0,
                templateId: res.templateId,
                responses: responseMap
            };
        });
    }, [assessmentResults]);

    const items = [...formEvidence].filter(i => i.snippet.toLowerCase().includes(query.toLowerCase()));

    const handleInsert = (item: EvidenceItem, type: 'ref' | 'quote') => {
        const text = type === 'quote' ? `"${item.snippet}" ` : "";
        onInsert(`${text}[[cite:${item.id}]]`);
        setSelectedItem(null);
    };

    // Helper to get template definition
    const getTemplate = (id?: string) => {
        // In real app, search all packs based on region
        return UK_PACK.capabilities.digitalForms.find(t => t.id === id);
    };

    return (
        <div className="h-full flex flex-col border-l bg-muted/10 w-[350px]">
            <div className="p-4 border-b space-y-3">
                <h3 className="font-semibold text-sm">Evidence & Citations</h3>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Search forms, notes..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-8 text-xs"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {loading && <div className="text-xs text-muted-foreground text-center">Loading sources...</div>}
                    
                    {items.map(item => (
                        <Card 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', `[[cite:${item.id}]]`);
                            }}
                            className="cursor-pointer hover:bg-white transition-all group border-l-4 border-l-indigo-400"
                            onClick={() => setSelectedItem(item)}
                        >
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="text-[10px] uppercase bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                        {item.type}
                                    </Badge>
                                    <div className="flex gap-1 items-center">
                                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-800 line-clamp-2">{item.snippet}</p>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] text-muted-foreground">{item.sourceDate}</span>
                                    <FileText className="h-3 w-3 text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {!loading && items.length === 0 && (
                         <div className="text-xs text-muted-foreground text-center py-8">
                            No evidence found.
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Detailed Modal */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Badge>{selectedItem?.type}</Badge>
                            Source Viewer
                        </DialogTitle>
                        <DialogDescription>
                            Review full submission content.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-slate-50 p-4 rounded-md text-sm border">
                        {selectedItem?.type === 'form' && selectedItem.templateId ? (
                            getTemplate(selectedItem.templateId) ? (
                                <FormBuilder 
                                    template={getTemplate(selectedItem.templateId)!} 
                                    initialData={selectedItem.responses} 
                                    readOnly 
                                />
                            ) : (
                                <div className="text-red-500">Template definition not found. Raw Data: {JSON.stringify(selectedItem.responses)}</div>
                            )
                        ) : (
                            <div className="whitespace-pre-wrap">{selectedItem?.fullText || selectedItem?.snippet}</div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-white py-2 border-t mt-4">
                        <Button variant="outline" onClick={() => selectedItem && handleInsert(selectedItem, 'quote')}>
                            Cite Quote
                        </Button>
                        <Button onClick={() => selectedItem && handleInsert(selectedItem, 'ref')}>
                            Link Source
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
