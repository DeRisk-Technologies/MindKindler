"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { MarketplaceItem } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Fix import if using shadcn patterns, but here relying on previous
import { Badge } from "@/components/ui/badge";
import { Check, X, ShieldCheck } from "lucide-react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ReviewQueuePage() {
    const { data: items } = useFirestoreCollection<MarketplaceItem>("marketplaceItems", "createdAt", "desc");
    const { toast } = useToast();

    // Mock filtering: In real app, query 'inReview' status
    // For demo, we show everything not published so we can approve drafts created in Publisher page
    const pendingItems = items.filter(i => i.status !== 'published' && i.status !== 'rejected');

    const handleApprove = async (id: string, certified: boolean) => {
        await updateDoc(doc(db, "marketplaceItems", id), {
            status: "published",
            certified
        });
        toast({ title: "Approved", description: "Item is now live." });
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Review Queue</h1>
            
            <div className="border rounded-lg">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Author</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {pendingItems.map(item => (
                            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle font-medium">{item.title}</td>
                                <td className="p-4 align-middle capitalize">{item.type}</td>
                                <td className="p-4 align-middle">{item.createdByUserId}</td>
                                <td className="p-4 align-middle text-right flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleApprove(item.id, false)}>
                                        <Check className="mr-2 h-4 w-4"/> Approve
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(item.id, true)}>
                                        <ShieldCheck className="mr-2 h-4 w-4"/> Certify
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pendingItems.length === 0 && <div className="p-8 text-center text-muted-foreground">No pending items.</div>}
            </div>
        </div>
    );
}
