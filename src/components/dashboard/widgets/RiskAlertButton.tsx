// src/components/dashboard/widgets/RiskAlertButton.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Siren, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface RiskAlertButtonProps {
    studentId?: string;
    caseId?: string;
    studentName?: string;
}

export function RiskAlertButton({ studentId, caseId, studentName }: RiskAlertButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [riskType, setRiskType] = useState('safeguarding');
    const [description, setDescription] = useState('');
    const [immediateDanger, setImmediateDanger] = useState('no');

    const handleSubmit = async () => {
        if (!user || !description) return;
        setLoading(true);

        try {
            const region = user.region || 'uk';
            const db = getRegionalDb(region);

            // 1. Create Alert Record
            await addDoc(collection(db, 'alerts'), {
                type: 'CRITICAL_RISK',
                severity: immediateDanger === 'yes' ? 'critical' : 'high',
                category: riskType,
                title: `URGENT: ${riskType.toUpperCase()} Risk Reported`,
                description: description,
                studentId: studentId || 'unknown',
                studentName: studentName || 'Unknown Student',
                caseId: caseId || 'general',
                reportedBy: user.uid,
                reporterName: user.displayName || 'Staff Member',
                status: 'open',
                tenantId: user.tenantId || 'default',
                createdAt: serverTimestamp(),
                requiresImmediateAction: true
            });

            // 2. (Optional) In real prod, trigger cloud function for SMS/Email via addDoc listener

            toast({ 
                title: "URGENT RISK LOGGED", 
                description: "The safeguarding lead has been notified immediately.", 
                variant: "destructive" 
            });
            
            setOpen(false);
            setDescription('');
            setImmediateDanger('no');

        } catch (e) {
            console.error("Failed to log risk", e);
            toast({ title: "Error", description: "Failed to log risk. Call emergency services if needed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2 shadow-sm font-bold animate-pulse">
                    <Siren className="h-4 w-4" />
                    Report Urgent Risk
                </Button>
            </DialogTrigger>
            <DialogContent className="border-red-500 border-2">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle className="text-xl font-black uppercase">Critical Incident Report</DialogTitle>
                    </div>
                    <DialogDescription className="font-semibold text-slate-900">
                        Use this form only for immediate safeguarding concerns or critical risks to life/limb.
                        <br/>
                        <span className="text-red-600 font-bold block mt-1">IF THERE IS IMMEDIATE DANGER, CALL 999 FIRST.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Risk Category</label>
                        <Select value={riskType} onValueChange={setRiskType}>
                            <SelectTrigger className="border-red-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="safeguarding">Safeguarding / Abuse</SelectItem>
                                <SelectItem value="self_harm">Self Harm / Suicide Risk</SelectItem>
                                <SelectItem value="violence">Violence / Aggression</SelectItem>
                                <SelectItem value="medical">Medical Emergency</SelectItem>
                                <SelectItem value="absconding">Absconding / Missing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Is the child in immediate danger right now?</label>
                        <Select value={immediateDanger} onValueChange={setImmediateDanger}>
                            <SelectTrigger className={immediateDanger === 'yes' ? "bg-red-50 border-red-500 text-red-900 font-bold" : ""}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no">No - Risk is managed / historic</SelectItem>
                                <SelectItem value="yes" className="text-red-600 font-bold">YES - IMMEDIATE DANGER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Incident Details</label>
                        <Textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what happened, who is involved, and what action you have taken..."
                            className="min-h-[100px] border-red-200 focus-visible:ring-red-500"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleSubmit} 
                        disabled={loading || !description}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Siren className="mr-2 h-4 w-4" />}
                        LOG CRITICAL ALERT
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
