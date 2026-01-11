// src/components/reporting/modals/SubmitForReviewModal.tsx
"use client";

import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubmitForReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (supervisorId: string, note: string) => Promise<void>;
    supervisors: { id: string, name: string }[];
}

export function SubmitForReviewModal({ isOpen, onClose, onSubmit, supervisors }: SubmitForReviewModalProps) {
    const [selectedSupervisor, setSelectedSupervisor] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedSupervisor) return;
        setIsSubmitting(true);
        try {
            await onSubmit(selectedSupervisor, note);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Submit for Supervision</DialogTitle>
                    <DialogDescription>
                        This report requires approval before it can be finalized. Select a supervisor.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Select Supervisor</label>
                        <Select onValueChange={setSelectedSupervisor} value={selectedSupervisor}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose senior EPP..." />
                            </SelectTrigger>
                            <SelectContent>
                                {supervisors.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Note (Optional)</label>
                        <Textarea 
                            placeholder="Specific areas to review..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!selectedSupervisor || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
