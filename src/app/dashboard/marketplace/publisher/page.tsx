"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { MarketplaceItem } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, UploadCloud } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PublisherPage() {
    const { data: myItems, loading } = useFirestoreCollection<MarketplaceItem>("marketplaceItems");
    const { toast } = useToast();
    const [open, setOpen] = useState(false); // Toggle view
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [type, setType] = useState("assessmentTemplate");
    const [desc, setDesc] = useState("");
    const [price, setPrice] = useState(0);

    const handleCreate = async () => {
        if (!title) return;
        setSubmitting(true);
        try {
            const item: Omit<MarketplaceItem, 'id'> = {
                title,
                type: type as any,
                description: desc,
                version: "1.0.0",
                status: "draft",
                createdByUserId: auth.currentUser?.uid || "unknown",
                certified: false,
                licensing: {
                    licenseType: price > 0 ? "tenantPaid" : "free",
                    price: price > 0 ? { amount: price, currency: "USD" } : undefined
                },
                installManifest: { actions: [] }, // Empty manifest for mock
                stats: { installs: 0, rating: 0 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await addDoc(collection(db, "marketplaceItems"), item);
            toast({ title: "Draft Created", description: "Submit for review when ready." });
            setOpen(false);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (open) {
        return (
            <div className="p-8 max-w-2xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold">New Marketplace Item</h1>
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="assessmentTemplate">Assessment</SelectItem>
                                    <SelectItem value="policyPack">Policy Pack</SelectItem>
                                    <SelectItem value="trainingBundle">Training Bundle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Price (USD)</Label>
                            <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
                            <p className="text-xs text-muted-foreground">Set to 0 for Free.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Draft
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Publisher Studio</h1>
                <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4"/> Create Item</Button>
            </div>

            <div className="grid gap-4">
                {myItems.map(item => (
                    <Card key={item.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>{item.status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="mt-4 flex gap-2">
                                {item.status === 'draft' && <Button size="sm" variant="outline">Submit for Review</Button>}
                                <Button size="sm" variant="ghost">Edit</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
