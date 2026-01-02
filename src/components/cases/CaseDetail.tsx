// src/components/cases/CaseDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { Case, CaseTimelineEvent } from "@/types/schema";
import { getCase, updateCase, addTimelineEvent } from "@/services/case-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface Props {
    tenantId: string;
    caseId: string;
    userId: string;
}

export function CaseDetail({ tenantId, caseId, userId }: Props) {
    const { toast } = useToast();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [timeline, setTimeline] = useState<CaseTimelineEvent[]>([]); // Mock for now, would fetch subcollection
    const [newNote, setNewNote] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getCase(tenantId, caseId);
            setCaseData(data);
            setLoading(false);
        }
        load();
    }, [caseId]);

    const handleStatusChange = async (newStatus: any) => {
        if (!caseData) return;
        setCaseData({ ...caseData, status: newStatus }); // Optimistic
        await updateCase(tenantId, caseId, { status: newStatus }, userId);
        toast({ title: "Status Updated", description: `Case marked as ${newStatus}` });
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        await addTimelineEvent(tenantId, caseId, {
            type: 'note',
            content: newNote,
            actorId: userId
        });
        setNewNote("");
        toast({ title: "Note Added" });
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!caseData) return <div>Case not found.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <Badge variant={caseData.priority === 'Critical' ? 'destructive' : 'outline'}>{caseData.priority}</Badge>
                                <h1 className="text-2xl font-bold mt-2">{caseData.title}</h1>
                            </div>
                            <Badge className="h-6 capitalize">{caseData.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{caseData.description}</p>
                    </CardContent>
                </Card>

                {/* Timeline Placeholder */}
                <Card>
                    <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." />
                            <Button onClick={handleAddNote}>Post</Button>
                        </div>
                        <div className="border-l-2 pl-4 py-2 space-y-4">
                            <div className="text-sm">
                                <span className="font-semibold">System</span> <span className="text-muted-foreground">created this case</span>
                                <div className="text-xs text-muted-foreground">{new Date(caseData.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {caseData.status !== 'active' && (
                            <Button onClick={() => handleStatusChange('active')}>Mark Active</Button>
                        )}
                        {caseData.status !== 'resolved' && (
                            <Button variant="outline" onClick={() => handleStatusChange('resolved')}>Resolve Case</Button>
                        )}
                        <Button variant="ghost">Escalate</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
