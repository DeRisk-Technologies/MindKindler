// src/components/reporting/modals/ShareModal.tsx
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Share2, Lock, AlertTriangle } from 'lucide-react';
import { RedactionLevel } from '@/types/schema';

// Mock service call
const shareReport = async (reportId: string, email: string, level: RedactionLevel) => {
    // Call Cloud Function `shareReport`
    return new Promise(resolve => setTimeout(resolve, 800));
};

interface ShareModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportId: string;
    studentName: string;
    hasConsent: boolean;
}

export function ShareModal({ open, onOpenChange, reportId, studentName, hasConsent }: ShareModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [level, setLevel] = useState<RedactionLevel>('PARENT_SAFE');
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        if (!hasConsent && level !== 'ANONYMIZED') {
            toast({ 
                title: "Consent Required", 
                description: "Cannot share PII without verified consent.", 
                variant: "destructive" 
            });
            return;
        }

        setLoading(true);
        try {
            await shareReport(reportId, email, level);
            toast({ title: "Shared Successfully", description: `Link sent to ${email}` });
            onOpenChange(false);
        } catch (e) {
            toast({ title: "Error", description: "Sharing failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-indigo-600" />
                        Share Report
                    </DialogTitle>
                    <DialogDescription>
                        Securely share this document with external stakeholders.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!hasConsent && (
                        <div className="bg-red-50 text-red-800 p-3 rounded text-sm flex gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                                <strong>No Consent on File.</strong> You can only share ANONYMIZED versions or obtain offline consent first.
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Recipient Email</Label>
                        <Input 
                            placeholder="parent@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Redaction Level</Label>
                        <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Clinical Record (Internal)</SelectItem>
                                <SelectItem value="PARENT_SAFE">Parent Safe (Redacted Internal Notes)</SelectItem>
                                <SelectItem value="ANONYMIZED">Anonymized (No PII)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            {level === 'FULL' ? 'Contains sensitive data.' : 
                             level === 'PARENT_SAFE' ? 'Hides internal comments.' : 
                             'Removes names and dates.'}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleShare} disabled={loading || (!email)}>
                        {loading ? 'Sending...' : 'Send Secure Link'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
