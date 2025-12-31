"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GuardianFinding } from "@/types/schema";
import { AlertTriangle, CheckCircle2, ShieldBan, Loader2, ShieldAlert } from "lucide-react";
import { updateDoc, doc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Props {
    findings: GuardianFinding[];
    onClose: () => void;
}

export function GuardianFindingsDialog({ findings, onClose }: Props) {
    const [open, setOpen] = useState(false);
    const [acknowledged, setAcknowledged] = useState<string[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    // Blocking / Override State
    const isBlocking = findings.some(f => f.blocking);
    const [overrideReason, setOverrideReason] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        if (findings.length > 0) setOpen(true);
    }, [findings]);

    const handleAcknowledge = async (id: string) => {
        await updateDoc(doc(db, "guardianFindings", id), {
            status: "acknowledged",
            acknowledgedBy: "user" 
        });
        setAcknowledged(prev => [...prev, id]);
    };

    const handleRequestOverride = async () => {
        if (!overrideReason) return;
        setIsRequesting(true);
        try {
            const blockingFinding = findings.find(f => f.blocking);
            await addDoc(collection(db, "guardianOverrideRequests"), {
                tenantId: "default",
                requestedByUserId: auth.currentUser?.uid || "unknown",
                requestedAt: new Date().toISOString(),
                status: "pending",
                subjectId: blockingFinding?.subjectId,
                ruleIds: findings.map(f => f.ruleId),
                findingIds: findings.map(f => f.id),
                reason: overrideReason,
                eventType: blockingFinding?.eventType
            });
            setRequestSent(true);
            toast({ title: "Request Sent", description: "Admin will review your override request." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsRequesting(false);
        }
    };

    const handleClose = () => {
        // If blocking, user cannot just "Continue" unless override approved (which would reload context)
        // They must cancel action.
        setOpen(false);
        onClose();
    };

    const handleSafeguarding = () => {
        // Navigate to create incident page or open modal
        // For simplicity in Phase 3B-2C, we redirect to list where they can create
        // Ideal: Pass params to pre-fill
        setOpen(false);
        router.push('/dashboard/intelligence/safeguarding');
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${isBlocking ? "text-red-600" : "text-amber-600"}`}>
                        {isBlocking ? <ShieldBan className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        {isBlocking ? "Action Blocked" : "Guardian Advisory"}
                    </DialogTitle>
                    <DialogDescription>
                        {isBlocking 
                            ? "Critical compliance rules prohibit this action. You must resolve the issues or request an override." 
                            : "We detected potential compliance considerations for this action."}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    {findings.map(f => (
                        <div key={f.id} className={`border p-3 rounded-md text-sm ${f.blocking ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                            <p className={`font-semibold ${f.blocking ? "text-red-800" : "text-amber-800"}`}>{f.message}</p>
                            <p className={`${f.blocking ? "text-red-700" : "text-amber-700"} mt-1`}>{f.remediation}</p>
                            
                            {/* Special Action for Safeguarding */}
                            {f.message.includes("Safeguarding") && (
                                <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={handleSafeguarding}>
                                    <ShieldAlert className="mr-2 h-4 w-4"/> Create Safeguarding Incident
                                </Button>
                            )}

                            {!f.blocking && (
                                acknowledged.includes(f.id) ? (
                                    <div className="mt-2 text-green-600 flex items-center text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledged
                                    </div>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="mt-2 h-6 text-xs hover:bg-amber-100 text-amber-900"
                                        onClick={() => handleAcknowledge(f.id)}
                                    >
                                        Acknowledge
                                    </Button>
                                )
                            )}
                        </div>
                    ))}
                </div>

                {isBlocking && !requestSent && (
                    <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium">Request Override</label>
                        <Textarea 
                            placeholder="Reason for bypassing this rule..." 
                            value={overrideReason}
                            onChange={e => setOverrideReason(e.target.value)}
                            className="text-xs"
                        />
                        <Button 
                            className="w-full bg-red-600 hover:bg-red-700 text-white" 
                            disabled={!overrideReason || isRequesting}
                            onClick={handleRequestOverride}
                        >
                            {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit Request
                        </Button>
                    </div>
                )}

                {requestSent && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm text-center">
                        Request pending approval. Please check Compliance Dashboard later.
                    </div>
                )}

                <DialogFooter>
                    <Button variant={isBlocking ? "outline" : "default"} onClick={handleClose}>
                        {isBlocking ? "Close" : "Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
