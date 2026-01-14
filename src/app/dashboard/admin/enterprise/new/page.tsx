// src/app/dashboard/admin/enterprise/new/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provisionIndependentEppAction } from "@/app/actions/admin-provisioning";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";

export default function NewTenantPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await provisionIndependentEppAction(data);

        if (result.success) {
            setSuccessData(result);
            toast({ title: "Success", description: "Independent EPP Provisioned." });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    if (successData) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-6 w-6" /> Provisioning Complete
                        </CardTitle>
                        <CardDescription className="text-green-700">
                            The Independent EPP environment is ready.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded border border-green-200 text-sm font-mono space-y-2">
                            <p><strong>Tenant ID:</strong> {successData.tenantId}</p>
                            <p><strong>Owner UID:</strong> {successData.uid}</p>
                            <p className="text-gray-500">// Credentials set as provided.</p>
                        </div>
                        <Button onClick={() => window.location.reload()}>Provision Another</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Provision Independent Practice</h1>
                <p className="text-muted-foreground">Creates Auth, Global Routing, Regional Profile, and Tenant Record in one atomic operation.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" /> 
                        New EPP Tenant
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input name="firstName" required placeholder="Jane" />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input name="lastName" required placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email (Admin Login)</Label>
                            <Input name="email" type="email" required placeholder="jane.doe@practice.com" />
                        </div>

                        <div className="space-y-2">
                            <Label>Initial Password</Label>
                            <Input name="password" type="password" required defaultValue="MindKindler2026!" />
                        </div>

                        <div className="space-y-2">
                            <Label>Data Residency Region</Label>
                            <Select name="region" defaultValue="uk">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="uk">United Kingdom (London)</SelectItem>
                                    <SelectItem value="us">United States (Iowa)</SelectItem>
                                    <SelectItem value="eu">Europe (Frankfurt)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Provision Tenant"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
