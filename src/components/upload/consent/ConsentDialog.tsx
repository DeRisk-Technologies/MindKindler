// src/components/upload/consent/ConsentDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ConsentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    tenantId: string;
}

export function ConsentDialog({ open, onOpenChange, studentId, studentName, tenantId }: ConsentDialogProps) {
    const { toast } = useToast();
    const [shareReports, setShareReports] = useState(false);
    const [dataTraining, setDataTraining] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const studentRef = doc(db, `tenants/${tenantId}/students/${studentId}`);
            
            await updateDoc(studentRef, {
                consent: {
                    shareReports,
                    shareDataForTraining: dataTraining,
                    updatedAt: serverTimestamp(),
                    updatedBy: 'user-id-placeholder' // In real app use auth context
                }
            });

            toast({ title: "Consent Recorded", description: "Permissions updated." });
            onOpenChange(false);
        } catch (e) {
            toast({ title: "Error", description: "Failed to save consent.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Consent for {studentName}</DialogTitle>
                    <DialogDescription>
                        Verify parental permissions before enabling external sharing or data use.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-2">
                        <Checkbox id="c1" checked={shareReports} onCheckedChange={(c) => setShareReports(!!c)} />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="c1">Share Reports Externally</Label>
                            <p className="text-sm text-muted-foreground">Allows sharing of redacted reports with parents/schools.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                        <Checkbox id="c2" checked={dataTraining} onCheckedChange={(c) => setDataTraining(!!c)} />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="c2">Data for Training</Label>
                            <p className="text-sm text-muted-foreground">Allows anonymized data to improve AI models.</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Confirm Consent'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
