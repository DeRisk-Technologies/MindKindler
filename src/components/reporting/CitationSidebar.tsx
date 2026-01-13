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
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb } from '@/lib/firebase';
import { collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore';

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
    // Assessment Specific
    scores?: any;
    category?: string;
}

interface CitationSidebarProps {
    onInsert: (citationToken: string) => void;
    studentId?: string; // New Prop
    region?: string;    // New Prop
}

export function CitationSidebar({ onInsert, studentId, region = 'UK' }: CitationSidebarProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
    const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual fetching to control DB source properly
    useEffect(() => {
        if (!user || !studentId) return;

        async function fetchEvidence() {
            setLoading(true);
            try {
                const db = getRegionalDb(user?.region);
                
                // Fetch Assessment Results (Forms & Standardized)
                const q = firestoreQuery(collection(db, 'assessment_results'), where('studentId', '==', studentId));
                const snap = await getDocs(q);

                const items: EvidenceItem[] = snap.docs.map(doc => {
                    const data = doc.data();
                    let type: EvidenceItem['type'] = 'form';
                    let snippet = data.templateId || 'Unknown Assessment';
                    
                    // Distinguish WISC/Cognitive from Forms
                    if (data.category === 'Cognitive' || data.templateId === 'WISC-V') {
                        type = 'assessment';
                        snippet = `${data.templateId || 'Assessment'} (Score: ${data.totalScore || 'N/A'})`;
                    } else {
                         // Find Template Title if possible
                         const template = UK_PACK.capabilities.digitalForms.find(t => t.id === data.templateId);
                         if(template) snippet = `${template.title}`;
                    }

                    return {
                        id: doc.id,
                        type,
                        snippet,
                        sourceDate: data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'Unknown',
                        templateId: data.templateId,
                        responses: data.responses,
                        scores: data.responses, // For standardized tests, responses ARE the scores
                        category: data.category
                    };
                });
                
                setEvidenceItems(items);

            } catch (e) {
                console.error("Failed to load evidence", e);
            } finally {
                setLoading(false);
            }
        }

        fetchEvidence();
    }, [user, studentId]);


    const items = evidenceItems.filter(i => i.snippet.toLowerCase().includes(query.toLowerCase()));

    const handleInsert = (item: EvidenceItem, type: 'ref' | 'quote') => {
        const text = type === 'quote' ? `"${item.snippet}" ` : "";
        onInsert(`${text}[[cite:${item.id}]]`);
        setSelectedItem(null);
    };

    // Helper to get template definition
    const getTemplate = (id?: string) => {
        return UK_PACK.capabilities.digitalForms.find(t => t.id === id);
    };

    // Helper to render assessment detail
    const renderDetail = (item: EvidenceItem) => {
        if (item.type === 'assessment' && item.scores) {
             // WISC-V or similar standardized render
             return (
                 <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                         {Object.entries(item.scores).map(([key, val]) => (
                             <div key={key} className="flex justify-between p-2 bg-white rounded border">
                                 <span className="text-muted-foreground">{key}</span>
                                 <span className="font-bold">{String(val)}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             );
        } else if (item.type === 'form' && item.templateId) {
             const tmpl = getTemplate(item.templateId);
             if (tmpl) {
                 return <FormBuilder template={tmpl} initialData={item.responses} readOnly />;
             }
             // Fallback for form without template (e.g. legacy or deleted template)
             return (
                 <div className="space-y-2">
                     <p className="text-amber-600 text-xs">Template definition unavailable. Displaying raw data.</p>
                     <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                         {JSON.stringify(item.responses, null, 2)}
                     </pre>
                 </div>
             );
        }
        return <div className="whitespace-pre-wrap">{item.fullText || item.snippet}</div>;
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
                        {selectedItem && renderDetail(selectedItem)}
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
