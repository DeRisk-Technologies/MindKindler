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

export default function InstalledPacksPage() {
    const { data: installed, loading } = useFirestoreCollection<InstalledPack>("installedPacks", "installedAt", "desc");
    const { toast } = useToast();
    const [processing, setProcessing] = useState<string | null>(null);

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

    if (loading) return <div>Loading...</div>;

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
                                        <Badge variant={p.status === 'installed' ? 'default' : 'secondary'} className="capitalize bg-green-600">
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {p.status === 'installed' && (
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
