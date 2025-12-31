"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SyncHealthPage() {
    // Mock Integrations List (Real app would query 'integrations')
    const integrations = [
        { id: "oneroster_1", name: "OneRoster (District A)", status: "active", lastSync: new Date().toISOString() }
    ];
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Sync Health</h1>
            
            <div className="grid gap-6">
                {integrations.map(int => (
                    <Card key={int.id}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Activity className="h-6 w-6 text-green-500" />
                                <div>
                                    <div className="font-bold text-lg">{int.name}</div>
                                    <div className="text-sm text-muted-foreground">Last Sync: {new Date(int.lastSync).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="default" className="bg-green-600 uppercase">{int.status}</Badge>
                                <Button variant="outline" onClick={() => router.push(`/dashboard/integrations/health/${int.id}`)}>
                                    Manage
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
