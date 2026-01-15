"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConsentRecord } from '@/types/schema';
import { ShieldCheck, AlertTriangle, FileSignature, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { createContributionRequest } from '@/app/actions/portal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface ConsentManagerProps {
    studentId: string;
    studentName?: string;
    consents: ConsentRecord[];
    onSave: (updates: ConsentRecord[]) => void;
}

export function ConsentManager({ studentId, studentName = "Student", consents, onSave }: ConsentManagerProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Local state to track changes before save
    const [localConsents, setLocalConsents] = useState<ConsentRecord[]>(consents);
    const [note, setNote] = useState('');
    
    // Request State
    const [isSending, setIsSending] = useState(false);
    const [parentEmail, setParentEmail] = useState('');

    const toggleConsent = (category: ConsentRecord['category']) => {
        setLocalConsents(prev => {
            const existing = prev.find(c => c.category === category);
            if (existing) {
                // Toggle status
                return prev.map(c => c.category === category ? {
                    ...c, 
                    status: c.status === 'granted' ? 'revoked' : 'granted',
                    grantedAt: new Date().toISOString()
                } : c);
            } else {
                // Add new
                return [...prev, {
                    id: crypto.randomUUID(),
                    studentId,
                    category,
                    status: 'granted',
                    grantedAt: new Date().toISOString(),
                    notes: ''
                }];
            }
        });
    };

    const handleSave = () => {
        onSave(localConsents.map(c => ({...c, notes: c.notes ? c.notes : note})));
        setNote('');
    };
    
    const handleSendRequest = async () => {
        if (!parentEmail || !user) return;
        setIsSending(true);
        try {
            await createContributionRequest(
                user.tenantId || 'default',
                studentId,
                studentName,
                parentEmail,
                'Parent',
                'consent_request',
                user.uid,
                user.region || 'uk'
            );
            toast({ title: "Request Sent", description: "Parent has been emailed a secure link." });
            setParentEmail('');
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const getStatus = (category: string) => {
        const c = localConsents.find(i => i.category === category);
        return c?.status === 'granted';
    };

    return (
        <div className="space-y-6">
            {/* 1. Request Digital Consent (The "Digital" Way) */}
            <Card className="border-indigo-100 bg-indigo-50/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-700">
                        <Send className="h-4 w-4" /> Request Digital Signature
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Send a secure magic link to the parent to sign GDPR consent online.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input 
                        placeholder="Parent Email Address..." 
                        value={parentEmail}
                        onChange={e => setParentEmail(e.target.value)}
                        className="bg-white"
                    />
                    <Button onClick={handleSendRequest} disabled={isSending || !parentEmail} className="bg-indigo-600 hover:bg-indigo-700">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Send Request"}
                    </Button>
                </CardContent>
            </Card>

            {/* 2. Manual Consent Management (The "Override" Way) */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        Manual Permissions
                    </CardTitle>
                    <CardDescription>
                        Manually record verbal or paper consent obtained offline.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* Categories */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Education Sharing</Label>
                                <p className="text-sm text-muted-foreground">Share academic data with schools & LEA.</p>
                            </div>
                            <Switch 
                                checked={getStatus('education_share')}
                                onCheckedChange={() => toggleConsent('education_share')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Health & Clinical Sharing</Label>
                                <p className="text-sm text-muted-foreground">Share medical alerts and psychologist reports.</p>
                            </div>
                            <Switch 
                                checked={getStatus('health_share')}
                                onCheckedChange={() => toggleConsent('health_share')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">AI & Research</Label>
                                <p className="text-sm text-muted-foreground">Allow anonymized data to train models.</p>
                            </div>
                            <Switch 
                                checked={getStatus('research')}
                                onCheckedChange={() => toggleConsent('research')}
                            />
                        </div>
                    </div>

                    {/* Evidence / Notes */}
                    <div className="space-y-2">
                        <Label>Evidence / Notes</Label>
                        <Textarea 
                            placeholder="e.g. Verbal consent given by Mother on phone call..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="text-xs"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSave} className="gap-2">
                            <FileSignature className="h-4 w-4" />
                            Sign & Update Consent
                        </Button>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex gap-2 text-xs text-yellow-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>Revoking consent will immediately block related data sharing and may affect active reports. History is preserved for audit.</p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
