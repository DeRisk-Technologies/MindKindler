"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { MarketplacePurchase } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PurchasesPage() {
    const { data: purchases, loading } = useFirestoreCollection<MarketplacePurchase>("marketplacePurchases", "purchasedAt", "desc");

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">My Purchases</h1>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-xs">{p.itemId}</TableCell>
                                    <TableCell>{new Date(p.purchasedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>${p.pricePaid}</TableCell>
                                    <TableCell><Badge>{p.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
