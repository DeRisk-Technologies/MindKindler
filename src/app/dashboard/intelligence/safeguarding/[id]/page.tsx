"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { SafeguardingIncident } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, ShieldAlert, User, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SafeguardingDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: incident, loading } = useFirestoreDocument<SafeguardingIncident>("safeguardingIncidents", id);
    const { toast } = useToast();
    const [status, setStatus] = useState("");
    const [note, setNote] = useState("");
    const [updating, setUpdating] = useState(false);

    if (loading || !incident) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await updateDoc(doc(db, "safeguardingIncidents", id), {
                status: newStatus,
                updatedAt: new Date().toISOString(),
                timelineEvents: arrayUnion({
                    at: new Date().toISOString(),
                    byUserId: auth.currentUser?.uid || "unknown",
                    action: `status_change_to_${newStatus}`,
                    notes: note
                })
            });
            toast({ title: "Updated", description: `Status changed to ${newStatus}` });
            setNote("");
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Safeguarding Incident <span className="text-muted-foreground font-normal text-sm">#{id.substring(0,8)}</span>
                    </h1>
                    <div className="flex gap-2 mt-1">
                        <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase">{incident.severity}</Badge>
                        <Badge variant="outline" className="capitalize">{incident.category}</Badge>
                        <Badge variant="default" className="capitalize bg-blue-600">{incident.status}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="whitespace-pre-wrap">{incident.description}</p>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3"/> Reported by {incident.createdByUserId} on {new Date(incident.createdAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Timeline & Audit Trail</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {incident.timelineEvents?.map((evt, idx) => (
                                <div key={idx} className="flex gap-3 text-sm border-l-2 pl-4 pb-4 last:pb-0 border-muted">
                                    <div className="text-muted-foreground text-xs min-w-[120px] pt-0.5">
                                        {new Date(evt.at).toLocaleString()}
                                    </div>
                                    <div>
                                        <div className="font-medium capitalize">{evt.action.replace(/_/g, ' ')}</div>
                                        {evt.notes && <div className="text-muted-foreground mt-1">{evt.notes}</div>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Add Note</label>
                                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for update..." className="h-20"/>
                            </div>
                            <div className="space-y-2">
                                <Button 
                                    className="w-full justify-start" 
                                    variant="outline" 
                                    onClick={() => handleUpdateStatus('underReview')}
                                    disabled={updating}
                                >
                                    <Clock className="mr-2 h-4 w-4"/> Mark Under Review
                                </Button>
                                <Button 
                                    className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white" 
                                    onClick={() => handleUpdateStatus('escalated')}
                                    disabled={updating}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4"/> Escalate Incident
                                </Button>
                                <Button 
                                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => handleUpdateStatus('closed')}
                                    disabled={updating}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4"/> Close Incident
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
