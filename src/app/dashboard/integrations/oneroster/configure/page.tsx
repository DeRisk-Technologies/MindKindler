// src/app/dashboard/integrations/oneroster/configure/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";

export default function ConfigureOneRosterPage() {
    const { toast } = useToast();
    const [baseUrl, setBaseUrl] = useState("");
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!baseUrl || !clientId || !clientSecret) return;
        setLoading(true);

        try {
            // Save to 'integrations' collection
            // In production, secrets should be stored in Secret Manager or encrypted
            // For V1, we store in a restricted collection
            await addDoc(collection(db, "integrations"), {
                type: 'oneroster',
                status: 'active',
                baseUrl,
                clientId, 
                clientSecret, // TODO: Encrypt client-side or use proxy
                createdAt: serverTimestamp(),
                lastSync: null
            });

            toast({ title: "Connected", description: "OneRoster integration enabled." });
            setBaseUrl(""); setClientId(""); setClientSecret("");
        } catch (e) {
            toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle>Configure OneRoster 1.1</CardTitle>
                            <CardDescription>Connect your Student Information System (SIS) for grade sync.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input placeholder="https://sis.example.com/ims/oneroster/v1p1" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Client ID</Label>
                        <Input placeholder="Obtained from SIS vendor" value={clientId} onChange={e => setClientId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <Input type="password" placeholder="••••••••••••••" value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
                    </div>

                    <Button onClick={handleSave} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {loading ? 'Verifying...' : 'Save & Connect'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
