"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Save } from "lucide-react";

export default function CaseSLARulesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenantId, setTenantId] = useState<string | null>(null);

    const [rules, setRules] = useState({
        autoCreateEnabled: false,
        autoCreateCritical: true,
        schoolThreshold: 5,
        escalationContact: ""
    });

    useEffect(() => {
        async function load() {
            const user = auth.currentUser;
            if (!user) return;
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const tid = userDoc.data()?.tenantId || 'global';
            setTenantId(tid);

            try {
                const snap = await getDoc(doc(db, "tenants", tid, "settings", "caseSlaRules"));
                if (snap.exists()) {
                    setRules(snap.data() as any);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        if (!tenantId) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "tenants", tenantId, "settings", "caseSlaRules"), {
                ...rules,
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser?.uid
            });
            toast({ title: "Rules Saved", description: "Automation settings updated." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-4xl p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Case Automation Rules</h1>
                <p className="text-muted-foreground">
                    Configure when the system should auto-create cases and how to handle overdue items.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Auto-Creation Logic</CardTitle>
                    <CardDescription>Guardian AI can proactively open cases based on these rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border p-4 rounded">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Auto-Creation</Label>
                            <p className="text-sm text-muted-foreground">Allow system to generate cases from alerts.</p>
                        </div>
                        <Switch 
                            checked={rules.autoCreateEnabled} 
                            onCheckedChange={(c) => setRules({...rules, autoCreateEnabled: c})} 
                        />
                    </div>

                    {rules.autoCreateEnabled && (
                        <div className="space-y-4 pl-4 border-l-2">
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="crit"
                                    checked={rules.autoCreateCritical}
                                    onCheckedChange={(c) => setRules({...rules, autoCreateCritical: c})}
                                />
                                <Label htmlFor="crit">Always create case for 'Critical' alerts</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label>School Cluster Threshold</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        className="w-24" 
                                        value={rules.schoolThreshold} 
                                        onChange={(e) => setRules({...rules, schoolThreshold: parseInt(e.target.value)})} 
                                    />
                                    <span className="text-sm text-muted-foreground">alerts of same type in 24h</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Triggers a 'School-Level' case investigation.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>SLA Escalation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label>Escalation Contact Email</Label>
                        <Input 
                            value={rules.escalationContact} 
                            onChange={(e) => setRules({...rules, escalationContact: e.target.value})} 
                            placeholder="head.epp@example.com"
                        />
                        <p className="text-xs text-muted-foreground">Notified when critical cases breach SLA.</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-end bg-muted/20 py-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Rules
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
