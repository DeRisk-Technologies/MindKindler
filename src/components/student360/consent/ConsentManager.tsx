"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConsentRecord } from '@/types/schema';
import { ShieldCheck, AlertTriangle, FileSignature } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConsentManagerProps {
    studentId: string;
    consents: ConsentRecord[];
    onSave: (updates: ConsentRecord[]) => void;
}

export function ConsentManager({ studentId, consents, onSave }: ConsentManagerProps) {
    // Local state to track changes before save
    const [localConsents, setLocalConsents] = useState<ConsentRecord[]>(consents);
    const [note, setNote] = useState('');

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

    const getStatus = (category: string) => {
        const c = localConsents.find(i => i.category === category);
        return c?.status === 'granted';
    };

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Consent & Data Permissions
                </CardTitle>
                <CardDescription>
                    Manage parental consent for data sharing and AI processing.
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
    );
}
