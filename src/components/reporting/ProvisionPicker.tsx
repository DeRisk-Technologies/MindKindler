// src/components/reporting/ProvisionPicker.tsx
"use client";

import React, { useState } from 'react';
import { 
    ScrollArea 
} from '@/components/ui/scroll-area';
import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, BookOpen } from 'lucide-react';
import PROVISION_BANK from '@/marketplace/catalog/uk_send_provision_bank.json';

interface ProvisionPickerProps {
    onInsert: (text: string) => void;
}

// Group by Category helper
const groupedProvisions = PROVISION_BANK.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
}, {} as Record<string, typeof PROVISION_BANK>);

export function ProvisionPicker({ onInsert }: ProvisionPickerProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredGroups = Object.entries(groupedProvisions).reduce((acc, [category, items]) => {
        const filteredItems = items.filter(item => 
            item.sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.statutory_provision.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.trigger_keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (filteredItems.length > 0) acc[category] = filteredItems;
        return acc;
    }, {} as Record<string, typeof PROVISION_BANK>);

    return (
        <div className="w-80 border-l bg-slate-50 flex flex-col h-full shadow-inner">
            <div className="p-4 border-b bg-white">
                <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold">
                    <BookOpen className="w-4 h-4" />
                    Statutory Provision Bank
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-slate-400" />
                    <Input 
                        placeholder="Search clauses (e.g. 'anxiety')..." 
                        className="pl-8 h-8 text-xs bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-grow p-2">
                <Accordion type="multiple" className="w-full space-y-2">
                    {Object.entries(filteredGroups).map(([category, items]) => (
                        <AccordionItem key={category} value={category} className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-2 px-3 bg-white border rounded-md shadow-sm mb-1 text-sm font-medium text-slate-700 data-[state=open]:text-indigo-600 data-[state=open]:border-indigo-200">
                                {category}
                                <Badge variant="secondary" className="ml-auto text-[10px] h-5">{items.length}</Badge>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-2 pr-1">
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
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
                                                {item.trigger_keywords.slice(0, 3).map(k => (
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
                        No provisions found matching "{searchTerm}".
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
