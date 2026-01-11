// src/components/reporting/modals/ReferralGeneratorModal.tsx
"use client";

import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import REFERRAL_TEMPLATES from '@/marketplace/catalog/uk_referral_templates.json';

interface ReferralGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    studentName: string;
    // Synthesis context to pass
    context: any; 
}

export function ReferralGeneratorModal({ isOpen, onClose, sessionId, studentName, context }: ReferralGeneratorModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [includePii, setIncludePii] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const activeTemplate = REFERRAL_TEMPLATES.find(t => t.id === selectedTemplateId);

    const handleGenerate = async () => {
        if (!selectedTemplateId) return;
        setIsGenerating(true);

        try {
            // In a real app, we might call a Server Action here to pre-generate
            // For now, we route to the Report Builder with special params
            
            // Construct query params
            const params = new URLSearchParams({
                sourceSessionId: sessionId,
                templateId: selectedTemplateId, // Use the referral template ID
                mode: 'referral',
                includePii: includePii ? 'true' : 'false'
            });

            toast({ title: "Creating Referral", description: "Redirecting to clinical editor..." });
            
            // Artificial delay for UX
            setTimeout(() => {
                router.push(`/dashboard/reports/builder?${params.toString()}`);
            }, 800);

        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Failed to initiate referral." });
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generate Referral Letter</DialogTitle>
                    <DialogDescription>
                        Create a formal request for support for {studentName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Destination Service</Label>
                        <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select service..." />
                            </SelectTrigger>
                            <SelectContent>
                                {REFERRAL_TEMPLATES.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.destination}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {activeTemplate && (
                        <div className="p-3 bg-slate-50 border rounded text-xs text-slate-600">
                            <strong>Guidance:</strong> {activeTemplate.prompt_instruction}
                        </div>
                    )}

                    <div className="flex items-start space-x-2 border-t pt-4">
                        <Checkbox 
                            id="pii" 
                            checked={includePii} 
                            onCheckedChange={(c) => setIncludePii(!!c)} 
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="pii" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Include Confidential PII?
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                If checked, full Name, DOB, and Address will be included. Ensure you have consent.
                            </p>
                        </div>
                    </div>
                    
                    {includePii && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-800 text-xs rounded border border-red-100">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Warning: This document will contain sensitive data.</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={!selectedTemplateId || isGenerating} className="bg-indigo-600">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Draft Letter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
