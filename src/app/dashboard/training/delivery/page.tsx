"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { TrainingModule, MessageOutbox } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Loader2, Smartphone, Send, Signal } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { sendSMS, sendUSSD } from "@/integrations/sms/gateway";

export default function DeliveryPage() {
    const { data: modules } = useFirestoreCollection<TrainingModule>("trainingModules", "createdAt", "desc");
    const { data: outbox } = useFirestoreCollection<MessageOutbox>("messageOutbox", "sentAt", "desc");
    const { toast } = useToast();
    const [sending, setSending] = useState(false);

    // Form
    const [moduleId, setModuleId] = useState("");
    const [channel, setChannel] = useState<"sms"|"ussd">("sms");
    const [preview, setPreview] = useState("");

    const handleSelectModule = (id: string) => {
        setModuleId(id);
        const mod = modules.find(m => m.id === id);
        if (mod) {
            setPreview(`LEARN: ${mod.title}\n\nKey: ${mod.contentBlocks[0]?.content.substring(0, 100)}...\n\nReply Y to continue.`);
        }
    };

    const handleSend = async () => {
        if (!moduleId) return;
        setSending(true);
        try {
            const payload = {
                tenantId: "default",
                channel,
                toUserId: "all_teachers", // Mock group
                payload: preview,
                status: "sent",
                sentAt: new Date().toISOString()
            };
            
            // 1. Record in DB
            await addDoc(collection(db, "messageOutbox"), payload);

            // 2. Call Gateway Mock
            if (channel === 'sms') await sendSMS({ to: "+1234567890", message: preview });
            else await sendUSSD({ to: "+1234567890", menu: { text: preview } });

            toast({ title: "Sent", description: `Broadcasted via ${channel.toUpperCase()}` });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Low-Bandwidth Delivery</h1>
                <p className="text-muted-foreground">Broadcast training summaries via SMS and USSD.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Compose Broadcast</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Module</label>
                            <Select value={moduleId} onValueChange={handleSelectModule}>
                                <SelectTrigger><SelectValue placeholder="Choose content..."/></SelectTrigger>
                                <SelectContent>
                                    {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Channel</label>
                            <div className="flex gap-4">
                                <Button variant={channel === 'sms' ? 'default' : 'outline'} onClick={() => setChannel('sms')} className="flex-1">
                                    <Smartphone className="mr-2 h-4 w-4"/> SMS
                                </Button>
                                <Button variant={channel === 'ussd' ? 'default' : 'outline'} onClick={() => setChannel('ussd')} className="flex-1">
                                    <Signal className="mr-2 h-4 w-4"/> USSD Menu
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preview (Max 160 chars)</label>
                            <div className="bg-slate-100 p-4 rounded-md font-mono text-xs border border-slate-300">
                                {preview || "Select a module to preview content."}
                            </div>
                            <div className="text-xs text-right text-muted-foreground">{preview.length} chars</div>
                        </div>
                        <Button className="w-full" onClick={handleSend} disabled={sending || !moduleId}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>} 
                            Broadcast Now
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Transmission Log</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outbox.map(msg => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{new Date(msg.sentAt).toLocaleTimeString()}</TableCell>
                                        <TableCell><Badge variant="outline">{msg.channel.toUpperCase()}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-green-600 text-xs">
                                                <CheckCircle2 className="h-3 w-3"/> Sent
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {outbox.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8">No messages sent.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CheckCircle2({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}
