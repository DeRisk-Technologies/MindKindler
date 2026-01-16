"use client";

import { InstalledPack } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle2, Loader2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { rollbackPack } from "@/marketplace/installer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getRegionalDb } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";

export default function InstalledPacksPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [processing, setProcessing] = useState<string | null>(null);
    const [installed, setInstalled] = useState<InstalledPack[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstalled = async () => {
            if (!user?.tenantId) return;
            
            try {
                // 1. Resolve Regional DB
                const db = await getRegionalDb(user.region || 'uk');
                
                // 2. Query Tenant's Installed Packs
                // Path: tenants/{tenantId}/installed_packs
                const packsRef = collection(db, `tenants/${user.tenantId}/installed_packs`);
                const snapshot = await getDocs(packsRef);
                
                const packs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as InstalledPack[];

                setInstalled(packs);
            } catch (err) {
                console.error("Failed to fetch installed packs:", err);
                toast({ title: "Error fetching data", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchInstalled();
    }, [user, toast]);

    const handleRollback = async (id: string) => {
        if (!confirm("Are you sure? This will delete all policies and content created by this pack.")) return;
        setProcessing(id);
        try {
            await rollbackPack(id);
            toast({ title: "Rollback Complete", description: "Pack artifacts removed." });
            // Refresh list
            setInstalled(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    };

    if (loading || !user) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600"/></div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Installed Packs</h1>
            </div>
            
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
                                    <TableCell className="font-mono text-xs font-medium">{p.packId}</TableCell>
                                    <TableCell>{p.version}</TableCell>
                                    <TableCell>{new Date(p.installedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.status === 'installed' || p.status === 'active' ? 'default' : 'secondary'} className="capitalize bg-green-600 hover:bg-green-700">
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
                            {installed.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground bg-gray-50/50">
                                        No packs installed yet. Visit the Marketplace to add capabilities.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
