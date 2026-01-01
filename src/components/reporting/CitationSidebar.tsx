// src/components/reporting/CitationSidebar.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, GripVertical, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface EvidenceItem {
    id: string;
    type: 'observation' | 'assessment' | 'interview';
    snippet: string;
    sourceDate: string;
    trustScore?: number;
    fullText?: string;
}

interface CitationSidebarProps {
    onInsert: (citationToken: string) => void;
}

// Mock search function 
const mockSearch = async (query: string): Promise<EvidenceItem[]> => {
    return [
        { 
            id: 'obs-101', 
            type: 'observation', 
            snippet: 'Student showed difficulty focusing during math.', 
            sourceDate: '2023-10-12', 
            trustScore: 0.9,
            fullText: "Full observation note: Observed 20 mins. Student left seat 4 times. Tapped pencil repeatedly."
        },
        { 
            id: 'ass-202', 
            type: 'assessment', 
            snippet: 'WISC-V Matrix Reasoning score: 85 (Low Average).', 
            sourceDate: '2023-09-01', 
            trustScore: 1.0,
            fullText: "WISC-V Assessment Report. Matrix Reasoning Scaled Score 7."
        },
    ];
};

export function CitationSidebar({ onInsert }: CitationSidebarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EvidenceItem[]>([]);
    const [searching, setSearching] = useState(false);
    
    // Modal State
    const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

    const handleSearch = async () => {
        setSearching(true);
        setTimeout(async () => {
            const items = await mockSearch(query);
            setResults(items);
            setSearching(false);
        }, 500);
    };

    const handleInsert = (item: EvidenceItem, type: 'ref' | 'quote' | 'paraphrase') => {
        if (type === 'ref') {
            onInsert(`[[cite:${item.id}]]`);
        } else if (type === 'quote') {
             onInsert(`"${item.snippet}" [[cite:${item.id}]]`);
        } else {
             onInsert(`(Paraphrase: ${item.snippet}) [[cite:${item.id}]]`);
        }
        setSelectedItem(null);
    };

    return (
        <div className="h-full flex flex-col border-l bg-muted/10 w-[350px]">
            <div className="p-4 border-b space-y-3">
                <h3 className="font-semibold text-sm">Evidence & Citations</h3>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Search case data..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-8 text-xs"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {searching && <div className="text-xs text-muted-foreground text-center">Searching...</div>}
                    
                    {!searching && results.map(item => (
                        <Card 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', `[[cite:${item.id}]]`);
                            }}
                            className="cursor-pointer hover:bg-accent transition-colors group"
                            onClick={() => setSelectedItem(item)}
                        >
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                                    <div className="flex gap-1 items-center">
                                        {item.trustScore && item.trustScore > 0.8 && (
                                            <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                                        )}
                                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
                                    </div>
                                </div>
                                <p className="text-xs line-clamp-3 text-muted-foreground">{item.snippet}</p>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] text-muted-foreground">{item.sourceDate}</span>
                                    <Info className="h-3 w-3 text-indigo-400" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {!searching && results.length === 0 && (
                         <div className="text-xs text-muted-foreground text-center py-8">
                            Search for evidence to cite.
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Detailed Modal */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Badge>{selectedItem?.type}</Badge>
                            Evidence Detail
                        </DialogTitle>
                        <DialogDescription>
                            Review full content before citing.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {selectedItem?.fullText || selectedItem?.snippet}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground border-t pt-4">
                        <div>
                            <span className="block font-semibold">Date</span>
                            {selectedItem?.sourceDate}
                        </div>
                        <div>
                            <span className="block font-semibold">ID</span>
                            {selectedItem?.id}
                        </div>
                         <div>
                            <span className="block font-semibold">Trust</span>
                            {selectedItem?.trustScore}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => selectedItem && handleInsert(selectedItem, 'quote')}>
                            Insert Quote
                        </Button>
                        <Button onClick={() => selectedItem && handleInsert(selectedItem, 'ref')}>
                            Insert Citation Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
