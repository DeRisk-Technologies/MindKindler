// src/components/dashboard/cases/RequestInfoWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createExternalRequest } from "@/app/actions/external-portal";
import { createContributionRequest } from "@/app/actions/portal";
import { Loader2, Send, CheckCircle, Clock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface RequestInfoWidgetProps {
    caseId: string;
    studentId: string;
    studentName: string;
    tenantId: string;
    parents?: any[]; // For pre-filling email
}

export function RequestInfoWidget({ caseId, studentId, studentName, tenantId, parents = [] }: RequestInfoWidgetProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [email, setEmail] = useState("");
    const [requests, setRequests] = useState<any[]>([]);

    // Load existing requests
    useEffect(() => {
        if (!user || !studentId) return;
        const db = getRegionalDb(user.region);
        
        // Listen to both collections
        const q1 = query(collection(db, 'contribution_requests'), where('studentId', '==', studentId));
        const q2 = query(collection(db, 'external_requests'), where('studentId', '==', studentId)); 

        const unsub1 = onSnapshot(q1, (snap) => {
            const views = snap.docs.map(d => ({ id: d.id, ...d.data(), category: 'view' }));
            setRequests(prev => mergeLists(prev, views, 'view'));
        });
        
        const unsub2 = onSnapshot(q2, (snap) => {
            const consents = snap.docs.map(d => ({ id: d.id, ...d.data(), category: 'consent' }));
            setRequests(prev => mergeLists(prev, consents, 'consent'));
        });

        return () => { unsub1(); unsub2(); };
    }, [user, studentId]);

    const mergeLists = (prev: any[], newItems: any[], type: string) => {
        const others = prev.filter(p => p.category !== type);
        const combined = [...others, ...newItems];
        // Sort by created/sent date (descending)
        return combined.sort((a,b) => {
            const dateA = a.createdAt || a.auditLog?.sentAt || '';
            const dateB = b.createdAt || b.auditLog?.sentAt || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    };

    const handleSend = async (type: string) => {
        if (!email) {
            toast({ title: "Email Required", description: "Please enter a recipient email.", variant: "destructive" });
            return;
        }
        
        setIsSending(true);
        try {
            if (type === 'consent_request') {
                await createExternalRequest({
                    tenantId,
                    studentId,
                    caseId,
                    recipientEmail: email,
                    recipientRole: 'Parent', 
                    type: 'consent_request',
                    consentConfig: { 
                        requiresInvolvement: true, 
                        requiresInformationSharing: true, 
                        requiresAudioRecording: true 
                    }
                }, user?.region);
            } else {
                // Parent View or School Advice
                await createContributionRequest(
                    tenantId,
                    studentId,
                    studentName,
                    email,
                    type === 'school_advice' ? 'SENCO' : 'Parent',
                    type as any,
                    user?.uid || 'unknown',
                    user?.region
                );
            }
            toast({ title: "Request Sent", description: `Secure link generated for ${email}` });
            setEmail("");
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to send request.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="border-indigo-100 shadow-sm h-full">
            <CardHeader className="pb-3 bg-indigo-50/30 border-b">
                <CardTitle className="text-base font-semibold text-indigo-900 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Request External Input
                </CardTitle>
                <CardDescription className="text-xs">Send secure magic links to gather evidence.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                <Tabs defaultValue="consent">
                    <TabsList className="w-full grid grid-cols-3 h-8">
                        <TabsTrigger value="consent" className="text-xs">Consent</TabsTrigger>
                        <TabsTrigger value="parent" className="text-xs">Parent</TabsTrigger>
                        <TabsTrigger value="school" className="text-xs">School</TabsTrigger>
                    </TabsList>
                    
                    {/* Common Input */}
                    <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Recipient Email</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="recipient@example.com" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="h-8 text-sm"
                                />
                                {parents.length > 0 && (
                                    <Select onValueChange={setEmail}>
                                        <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {parents.map((p: any) => (
                                                <SelectItem key={p.email} value={p.email}>{p.relationshipType}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <TabsContent value="consent" className="mt-0">
                            <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-900" onClick={() => handleSend('consent_request')} disabled={isSending}>
                                {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>}
                                Send Consent Form
                            </Button>
                        </TabsContent>
                        <TabsContent value="parent" className="mt-0">
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSend('parent_view')} disabled={isSending}>
                                {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>}
                                Request Section A
                            </Button>
                        </TabsContent>
                        <TabsContent value="school" className="mt-0">
                            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => handleSend('school_advice')} disabled={isSending}>
                                {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>}
                                Request School Advice
                            </Button>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Status List */}
                <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Requests</h4>
                    {requests.length === 0 ? (
                        <div className="text-xs text-slate-400 italic text-center py-4">No active requests.</div>
                    ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {requests.map(req => (
                                <div key={req.id} className="flex flex-col gap-1 p-2 bg-slate-50 rounded border text-xs">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {req.status === 'submitted' ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-amber-500" />}
                                            <span className="font-semibold text-slate-700">
                                                {req.type === 'consent_request' ? 'Legal Consent' : 
                                                 req.type === 'parent_view' ? 'Parent Views' : 'School Data'}
                                            </span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                            req.status === 'submitted' ? 'bg-green-100 text-green-700' : 
                                            req.status === 'opened' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="text-slate-500 truncate" title={req.recipientEmail}>
                                        To: {req.recipientEmail}
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-right">
                                        {new Date(req.createdAt || req.auditLog?.sentAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
