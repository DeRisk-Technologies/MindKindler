// src/app/dashboard/admin/ai-config/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_MODELS, FEATURE_METADATA, FEATURE_MODEL_DEFAULTS } from "@/ai/config";
import { Loader2, Save, Info, BrainCircuit } from "lucide-react";

export default function AIConfigPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<Record<string, string>>(FEATURE_MODEL_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Fetch tenant or global org settings
                const docRef = doc(db, "organization_settings", "ai_models");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setConfig({ ...FEATURE_MODEL_DEFAULTS, ...snap.data().models });
                }
            } catch (e) {
                console.error("Failed to load AI config", e);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "organization_settings", "ai_models"), {
                models: config,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast({ title: "Configuration Saved", description: "Model preferences updated." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        AI Model Configuration
                    </h2>
                    <p className="text-muted-foreground">Optimize cost and performance by selecting specific Gemini models for each feature.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>

            <div className="grid gap-4">
                {Object.entries(FEATURE_METADATA).map(([key, meta]) => (
                    <Card key={key}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{meta.label}</CardTitle>
                                    <CardDescription>{meta.description}</CardDescription>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                    Recommended: {AVAILABLE_MODELS.find(m => m.value === meta.recommended)?.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Select 
                                    value={config[key] || meta.recommended} 
                                    onValueChange={(val) => setConfig({ ...config, [key]: val })}
                                >
                                    <SelectTrigger className="w-[300px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_MODELS.map(model => (
                                            <SelectItem key={model.value} value={model.value}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{model.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                {config[key] === 'googleai/gemini-1.5-flash' && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <Info className="h-3 w-3" /> Cost Effective
                                    </span>
                                )}
                                {config[key].includes('pro') && (
                                    <span className="text-xs text-blue-600 flex items-center gap-1">
                                        <Info className="h-3 w-3" /> High Reasoning
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
