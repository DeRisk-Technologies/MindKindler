"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { installPack } from "@/marketplace/installer";
import { useToast } from "@/hooks/use-toast";

// Mock Loader (In real app, fetch from API or dynamic import based on ID)
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import usPack from "@/marketplace/catalog/us_district_pack.json";
import ngPack from "@/marketplace/catalog/nigeria_foundation_pack.json";
import dachPack from "@/marketplace/catalog/dach_pack.json";
import gulfPack from "@/marketplace/catalog/gulf_pack.json";

const CATALOG: Record<string, any> = {
    uk_la_pack: ukPack,
    us_district_pack: usPack,
    nigeria_foundation_pack: ngPack,
    dach_pack: dachPack,
    gulf_pack: gulfPack
};

export default function PackDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [installing, setInstalling] = useState(false);

    const pack = CATALOG[id];

    if (!pack) return <div>Pack not found</div>;

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await installPack(pack);
            toast({ title: "Installation Complete", description: `${pack.name} deployed.` });
            router.push('/dashboard/marketplace/installed');
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold">{pack.name}</h1>
                    <div className="flex gap-2 mt-2">
                        {pack.regionTags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{pack.description}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Contents</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {pack.actions.map((action: any, i: number) => (
                                    <li key={i} className="flex gap-4 border-l-2 pl-4 border-slate-200">
                                        <div className="text-sm">
                                            <div className="font-semibold capitalize">{action.type.replace('create', '')}</div>
                                            <div className="text-muted-foreground">{action.payload.title}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader><CardTitle>Install</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Version: {pack.version}<br/>
                                Items: {pack.actions.length}
                            </div>
                            <Button className="w-full" onClick={handleInstall} disabled={installing}>
                                {installing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                                Install Pack
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
