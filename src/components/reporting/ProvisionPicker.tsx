// src/components/reporting/ProvisionPicker.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, BookOpen, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import all region banks
import UK_BANK from '@/marketplace/catalog/uk_send_provision_bank.json';
import US_BANK from '@/marketplace/catalog/us_idea_provision_bank.json';
import UAE_BANK from '@/marketplace/catalog/uae_khda_provision_bank.json';

interface ProvisionPickerProps {
    onInsert: (text: string) => void;
    region?: string; // e.g. 'UK', 'US', 'UAE'
}

export function ProvisionPicker({ onInsert, region = 'UK' }: ProvisionPickerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    
    // Allow manual override for testing/multi-jurisdiction EPPs
    const [selectedRegion, setSelectedRegion] = useState<string>(region.toUpperCase());

    const activeBank = useMemo(() => {
        switch (selectedRegion) {
            case 'US': return US_BANK;
            case 'UAE': return UAE_BANK;
            default: return UK_BANK;
        }
    }, [selectedRegion]);

    const bankName = useMemo(() => {
        switch (selectedRegion) {
            case 'US': return "IDEA Accommodations";
            case 'UAE': return "KHDA Inclusive Ed.";
            default: return "UK SEND Provisions";
        }
    }, [selectedRegion]);

    // Group by Category
    const groupedProvisions = useMemo(() => {
        return activeBank.reduce((acc: any, item: any) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, typeof activeBank>);
    }, [activeBank]);

    const filteredGroups = useMemo(() => {
        return Object.entries(groupedProvisions).reduce((acc: any, [category, items]: [string, any]) => {
            const filteredItems = items.filter((item: any) => 
                item.sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.statutory_provision.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.trigger_keywords && item.trigger_keywords.some((k: string) => k.toLowerCase().includes(searchTerm.toLowerCase())))
            );
            if (filteredItems.length > 0) acc[category] = filteredItems;
            return acc;
        }, {} as Record<string, typeof activeBank>);
    }, [groupedProvisions, searchTerm]);

    return (
        <div className="w-80 border-l bg-slate-50 flex flex-col h-full shadow-inner">
            <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                        <BookOpen className="w-4 h-4" />
                        {bankName}
                    </div>
                    {/* Region Switcher */}
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className="w-[70px] h-6 text-[10px] px-1">
                            <SelectValue placeholder="Reg" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UK">UK</SelectItem>
                            <SelectItem value="US">US</SelectItem>
                            <SelectItem value="UAE">UAE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-slate-400" />
                    <Input 
                        placeholder="Search clauses..." 
                        className="pl-8 h-8 text-xs bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-grow p-2">
                <Accordion type="multiple" className="w-full space-y-2">
                    {Object.entries(filteredGroups).map(([category, items]: [string, any]) => (
                        <AccordionItem key={category} value={category} className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-2 px-3 bg-white border rounded-md shadow-sm mb-1 text-sm font-medium text-slate-700 data-[state=open]:text-indigo-600 data-[state=open]:border-indigo-200">
                                <span className="truncate max-w-[180px] text-left">{category}</span>
                                <Badge variant="secondary" className="ml-auto text-[10px] h-5">{items.length}</Badge>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-2 pr-1">
                                <div className="space-y-2">
                                    {items.map((item: any, idx: number) => (
                                        <div key={idx} className="group relative bg-white p-3 rounded border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                             onClick={() => onInsert(item.statutory_provision)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-600">{item.sub_category}</span>
                                                <PlusCircle className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-3 group-hover:text-slate-800">
                                                "{item.statutory_provision}"
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {item.trigger_keywords && item.trigger_keywords.slice(0, 3).map((k: string) => (
                                                    <span key={k} className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">{k}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {Object.keys(filteredGroups).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                        No provisions found matching "{searchTerm}" in {selectedRegion}.
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
