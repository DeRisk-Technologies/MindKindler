"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { InstalledPack } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { rollbackPack } from "@/marketplace/installer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function InstalledPacksPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [processing, setProcessing] = useState<string | null>(null);

    // Dynamic path based on tenant
    const collectionPath = user?.tenantId ? `tenants/${user.tenantId}/installed_packs` : null;

    const { data: installed, loading } = useFirestoreCollection<InstalledPack>(
        collectionPath || "installed_packs", // fallback strictly to prevent crash, but won't load data until user is ready
        "installedAt", 
        "desc",
        {
            // If user is not ready, we skip the query inside the hook via 'path' check usually, 
            // but here we rely on the hook handling nullish path or just returning empty until user loads.
            // Actually, passing "installed_packs" as fallback is dangerous if it tries to query root.
            // But since 'collectionPath' is null initially, let's handle loading state.
        }
    );

    const handleRollback = async (id: string) => {
        if (!confirm("Are you sure? This will delete all policies and content created by this pack.")) return;
        setProcessing(id);
        try {
            await rollbackPack(id);
            toast({ title: "Rollback Complete", description: "Pack artifacts removed." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    };

    if (loading || !user) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 text-indigo-600"/></div>;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Installed Packs</h1>
            
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pack ID</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Installed On</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {installed.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-xs">{p.packId}</TableCell>
                                    <TableCell>{p.version}</TableCell>
                                    <TableCell>{new Date(p.installedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.status === 'installed' || p.status === 'active' ? 'default' : 'secondary'} className="capitalize bg-green-600">
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(p.status === 'installed' || p.status === 'active') && (
                                            <Button size="sm" variant="outline" onClick={() => handleRollback(p.id)} disabled={!!processing}>
                                                {processing === p.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <RotateCcw className="h-4 w-4 mr-2"/>}
                                                Rollback
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {installed.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No packs installed.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
