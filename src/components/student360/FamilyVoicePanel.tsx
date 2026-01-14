"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Home, MessageCircle, AlertCircle } from 'lucide-react';
import { StudentRecord } from '@/types/schema';

// Extended interface to match Ingestion Worker output
interface ExtendedStudent extends StudentRecord {
    voice?: {
        parentView?: {
            strengths: string[];
            aspirations: string;
            history: string;
            homeSupport: string;
            providedBy: string;
            updatedAt: string;
        }
    }
}

interface FamilyVoicePanelProps {
    student: ExtendedStudent;
}

export function FamilyVoicePanel({ student }: FamilyVoicePanelProps) {
    const parentView = student.voice?.parentView;

    if (!parentView) {
        return (
            <Card className="h-full border-dashed border-2 shadow-none">
                <CardContent className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No Family Voice recorded.</p>
                    <p className="text-xs">Request "Section A" contribution to populate.</p>
                </CardContent>
            </Card>
        );
    }

    const lastUpdated = new Date(parentView.updatedAt).toLocaleDateString();

    return (
        <Card className="border-indigo-100 h-full">
            <CardHeader className="pb-3 bg-indigo-50/30 border-b">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold text-indigo-900 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-indigo-500" /> Family Voice (Section A)
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-white text-indigo-600">
                        Updated {lastUpdated}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                
                {/* Strengths */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Strengths
                    </h4>
                    <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-900 italic">
                        "{parentView.strengths.join(', ')}"
                    </div>
                </div>

                {/* Aspirations */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> Aspirations
                    </h4>
                    <p className="text-sm text-slate-700">
                        {parentView.aspirations || "Not specified"}
                    </p>
                </div>

                {/* Home Support */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <Home className="h-3 w-3" /> At Home
                    </h4>
                    <p className="text-sm text-slate-700">
                        {parentView.homeSupport || "Not specified"}
                    </p>
                </div>

                {/* Triangulation Tip (Stubbed Logic) */}
                <div className="mt-4 p-2 border border-amber-200 bg-amber-50 rounded flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                        <span className="font-semibold">AI Insight:</span> Family reports positive engagement with Lego therapy at home. Consider referencing this in Section F (Provision).
                    </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right mt-2">
                    Provided by: {parentView.providedBy}
                </div>
            </CardContent>
        </Card>
    );
}
