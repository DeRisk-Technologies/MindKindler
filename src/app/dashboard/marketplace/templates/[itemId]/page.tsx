"use client";

import { useFirestoreDocument, useFirestoreCollection } from "@/hooks/use-firestore";
import { MarketplaceItem, MarketplaceReview } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShieldCheck, Download, ShoppingCart, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { installPack } from "@/marketplace/installer";

export default function ItemDetailPage() {
    const { itemId } = useParams() as { itemId: string };
    const { data: item, loading } = useFirestoreDocument<MarketplaceItem>("marketplaceItems", itemId);
    const { data: reviews } = useFirestoreCollection<MarketplaceReview>("marketplaceReviews"); // Should filter by item
    const itemReviews = reviews.filter(r => r.itemId === itemId);
    
    const router = useRouter();
    const { toast } = useToast();
    const [processing, setProcessing] = useState(false);

    if (loading || !item) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const handleInstall = async () => {
        setProcessing(true);
        try {
            // Check license (Mock)
            if (item.licensing.licenseType !== 'free') {
                // Create Purchase Request
                await addDoc(collection(db, "marketplacePurchases"), {
                    itemId: item.id,
                    tenantId: "default",
                    purchasedAt: new Date().toISOString(),
                    purchasedByUserId: auth.currentUser?.uid,
                    pricePaid: item.licensing.price?.amount || 0,
                    status: 'active' // Auto-approve mock
                });
                toast({ title: "Purchased!", description: "License active." });
            }

            // Install
            await installPack({
                id: item.id,
                name: item.title,
                description: item.description,
                version: item.version,
                regionTags: [],
                actions: item.installManifest.actions // Assuming stored flat
            });
            toast({ title: "Installed", description: "Content added to your workspace." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleRate = async () => {
        // Mock Rating
        await addDoc(collection(db, "marketplaceReviews"), {
            itemId: item.id,
            rating: 5,
            comment: "Great content!",
            userId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
        });
        toast({ title: "Review Submitted" });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {item.title} {item.certified && <ShieldCheck className="h-6 w-6 text-green-600"/>}
                    </h1>
                    <div className="flex gap-2 mt-2">
                        <Badge>{item.type}</Badge>
                        <Badge variant="outline">v{item.version}</Badge>
                        <Badge variant="secondary">{item.publisherOrg || "Independent"}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-muted-foreground">{item.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Reviews ({itemReviews.length})</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {itemReviews.map(r => (
                                <div key={r.id} className="border-b pb-4 last:border-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : "text-slate-200"}`}/>)}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm">{r.comment}</p>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={handleRate}>Write a Review</Button>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-8">
                        <CardHeader><CardTitle>Get this Item</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-2xl font-bold">
                                {item.licensing.licenseType === 'free' ? "Free" : `$${item.licensing.price?.amount}`}
                            </div>
                            <Button className="w-full size-lg" onClick={handleInstall} disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {item.licensing.licenseType === 'free' ? <><Download className="mr-2 h-4 w-4"/> Install Now</> : <><ShoppingCart className="mr-2 h-4 w-4"/> Purchase</>}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">Compatible with v1.0+</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
