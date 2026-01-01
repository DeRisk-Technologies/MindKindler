// src/components/reporting/SignOffModal.tsx
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportService } from '@/services/report-service';

interface SignOffModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportId: string;
    tenantId: string;
    content: any; // Current content to hash/snapshot
    onSigned: () => void;
}

export function SignOffModal({ open, onOpenChange, reportId, tenantId, content, onSigned }: SignOffModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleSign = async () => {
        if (!confirmed) return;
        setLoading(true);
        try {
            // 1. Create hash (simple client-side for now, ideally server enforced)
            const contentStr = JSON.stringify(content);
            const signatureHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentStr))
                .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

            // 2. Call service to finalize
            await ReportService.signReport(tenantId, reportId, content, signatureHash);
            
            toast({ title: "Report Signed", description: "Document is now locked and finalized." });
            onSigned();
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to sign report.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Finalize & Sign Report
                    </DialogTitle>
                    <DialogDescription>
                        This action will lock the report. No further edits can be made to this version.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded text-sm text-amber-800">
                        Warning: This creates a permanent legal record. Please ensure all redactions are applied before signing.
                    </div>
                    
                    <div className="flex items-start gap-3 pt-2">
                        <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
                        <Label htmlFor="confirm" className="text-sm leading-tight">
                            I attest that this clinical report is accurate and based on verified evidence. 
                            I understand this version will be immutable.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSign} disabled={!confirmed || loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign & Lock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
