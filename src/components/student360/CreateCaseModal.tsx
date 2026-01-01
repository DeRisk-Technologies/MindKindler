// src/components/student360/CreateCaseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertData } from "./AlertCard";
import { createCaseFromAlert } from "@/services/case-service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert?: AlertData;
    studentId: string;
    tenantId: string;
    userId: string; // Current user ID
}

export function CreateCaseModal({ isOpen, onClose, alert, studentId, tenantId, userId }: CreateCaseModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<string>("Medium");

    // Auto-fill from alert when it changes
    useEffect(() => {
        if (alert) {
            setTitle(`Case: ${alert.title}`);
            setDescription(alert.description + (alert.evidence ? `\n\nEvidence:\n- ${alert.evidence.map(e => e.snippet).join('\n- ')}` : ""));
            setPriority(alert.severity === 'critical' ? 'Critical' : alert.severity === 'high' ? 'High' : 'Medium');
        } else {
            setTitle("");
            setDescription("");
            setPriority("Medium");
        }
    }, [alert]);

    const handleCreate = async () => {
        if (!title || !studentId) return;
        setLoading(true);
        try {
            await createCaseFromAlert({
                tenantId,
                studentId,
                title,
                description,
                priority: priority as any,
                sourceAlertId: alert?.id,
                evidence: alert?.evidence,
                createdBy: userId
            });
            
            toast({ title: "Success", description: "Case created successfully." });
            onClose();
        } catch (e) {
            toast({ title: "Error", description: "Failed to create case.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Case</DialogTitle>
                    <DialogDescription>
                        Escalate this issue to a formal case file.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Case Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Attendance Concern" />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Critical">Critical</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Description & Evidence</Label>
                        <Textarea 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            className="h-32" 
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading || !title}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Case
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
