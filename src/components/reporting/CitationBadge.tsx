// src/components/reporting/CitationBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink, Quote } from "lucide-react";

interface CitationBadgeProps {
    id: string; // The citation reference ID (e.g. obs-1)
    label?: string; // e.g. "Observation 1"
    evidence?: any; // The full evidence object if available
    onClick?: () => void;
}

export function CitationBadge({ id, label, evidence, onClick }: CitationBadgeProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <span className="inline-flex items-center align-middle mx-1 cursor-pointer select-none">
                     <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1 hover:bg-indigo-100 border-indigo-200 text-indigo-700">
                        <Info className="h-3 w-3" />
                        {label || id}
                    </Badge>
                </span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-lg" align="start">
                <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Evidence Source</span>
                    <Badge variant="outline" className="text-[10px] bg-white">{evidence?.type || 'Source'}</Badge>
                </div>
                <div className="p-4 space-y-3">
                    <p className="text-sm italic text-slate-700">"{evidence?.snippet || 'Evidence content loading...'}"</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Date: {evidence?.sourceDate || 'Unknown'}</span>
                        <span>Trust: {evidence?.trustScore ? `${(evidence.trustScore * 100).toFixed(0)}%` : 'N/A'}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                         <Button size="sm" variant="outline" className="w-full text-xs" onClick={onClick}>
                            <ExternalLink className="mr-2 h-3 w-3" /> View Full
                        </Button>
                        <Button size="sm" variant="default" className="w-full text-xs">
                            <Quote className="mr-2 h-3 w-3" /> Insert Quote
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
