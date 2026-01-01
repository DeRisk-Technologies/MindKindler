// src/components/upload/StagingReview.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ReconciliationService } from "@/services/reconciliation-service";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, XCircle, UserCheck } from "lucide-react";

interface StagingReviewProps {
    tenantId: string;
    userId: string;
    role: 'assistant' | 'epp';
}

export function StagingReview({ tenantId, userId, role }: StagingReviewProps) {
    const [items, setItems] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>(null); // Local state for edits
    const { toast } = useToast();

    useEffect(() => {
        const q = query(
            collection(db, `tenants/${tenantId}/document_staging`),
            where('status', 'in', ['review_required', 'pending_approval'])
        );
        return onSnapshot(q, (snap) => {
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, [tenantId]);

    const selectedItem = items.find(i => i.id === selectedId);

    const handleSelect = (item: any) => {
        setSelectedId(item.id);
        setEditData(item.aiResult?.data || {});
    };

    const handleApprove = async () => {
        if (!selectedId) return;
        try {
            await ReconciliationService.approveExtraction(tenantId, selectedId, userId, editData);
            toast({ title: "Approved", description: "Document published." });
            setSelectedId(null);
        } catch (e) {
            toast({ title: "Error", description: "Approval failed.", variant: "destructive" });
        }
    };

    const handleEscalate = async () => {
        if (!selectedId) return;
        try {
            await ReconciliationService.requestEPPReview(tenantId, selectedId, "Please check grade field.", userId);
            toast({ title: "Escalated", description: "Sent to EPP for review." });
            setSelectedId(null);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="grid grid-cols-3 gap-6 h-[600px]">
            {/* List */}
            <Card className="col-span-1 overflow-y-auto">
                <CardHeader>
                    <CardTitle className="text-sm">Review Queue ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {items.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => handleSelect(item)}
                            className={`p-3 border rounded cursor-pointer text-sm ${selectedId === item.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-medium truncate">{item.documentId}</span>
                                <Badge variant={item.aiResult?.confidence > 0.8 ? 'outline' : 'destructive'}>
                                    {(item.aiResult?.confidence * 100).toFixed(0)}%
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                                {item.status.replace('_', ' ')}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Editor */}
            <Card className="col-span-2 flex flex-col">
                {selectedItem ? (
                    <>
                        <CardHeader className="border-b py-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Reconcile Data</CardTitle>
                                <div className="flex gap-2">
                                    {role === 'assistant' ? (
                                        <Button size="sm" variant="secondary" onClick={handleEscalate}>
                                            <UserCheck className="mr-2 h-4 w-4" /> Request Review
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="destructive">Reject</Button>
                                    )}
                                    <Button size="sm" onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 grid grid-cols-2">
                            {/* Raw / OCR View */}
                            <div className="p-4 border-r bg-slate-50 overflow-y-auto text-xs font-mono whitespace-pre-wrap">
                                <h4 className="font-bold text-slate-500 mb-2">OCR Text</h4>
                                {selectedItem.ocrText || "No text extracted."}
                            </div>

                            {/* Form Editor */}
                            <div className="p-4 overflow-y-auto space-y-4">
                                {editData && Object.keys(editData).map(key => (
                                    <div key={key}>
                                        <label className="text-xs font-semibold capitalize text-muted-foreground">{key}</label>
                                        {typeof editData[key] === 'string' || typeof editData[key] === 'number' ? (
                                            <Input 
                                                value={editData[key]} 
                                                onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                                                className="mt-1 h-8 text-sm"
                                            />
                                        ) : (
                                            <Textarea 
                                                value={JSON.stringify(editData[key], null, 2)}
                                                readOnly
                                                className="mt-1 h-20 text-xs font-mono bg-slate-50"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Select an item to review.
                    </div>
                )}
            </Card>
        </div>
    );
}
