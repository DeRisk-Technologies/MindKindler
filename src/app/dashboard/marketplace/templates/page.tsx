"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { MarketplaceItem } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, ShieldCheck, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TemplatesStorePage() {
    const { data: items, loading } = useFirestoreCollection<MarketplaceItem>("marketplaceItems", "createdAt", "desc");
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    const publishedItems = items.filter(i => i.status === 'published');
    const filtered = publishedItems.filter(i => 
        (filterType === 'all' || i.type === filterType) &&
        (i.title.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Template Store</h1>
                    <p className="text-muted-foreground">Find expert content from verified publishers.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/marketplace/purchases')}>My Purchases</Button>
                    <Button onClick={() => router.push('/dashboard/marketplace/publisher')}>Become a Publisher</Button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search templates..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="assessmentTemplate">Assessments</SelectItem>
                        <SelectItem value="policyPack">Policies</SelectItem>
                        <SelectItem value="trainingBundle">Training</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map(item => (
                    <Card key={item.id} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/dashboard/marketplace/templates/${item.id}`)}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="capitalize">{item.type.replace('Template', '').replace('Pack', '')}</Badge>
                                {item.certified && <ShieldCheck className="h-5 w-5 text-green-600" />}
                            </div>
                            <CardTitle className="mt-2 text-lg leading-tight">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between">
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t">
                                <div className="flex items-center gap-1 text-xs font-semibold">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400"/> {item.stats?.rating || "New"}
                                </div>
                                <div className="font-bold text-sm">
                                    {item.licensing.licenseType === 'free' ? "Free" : `$${item.licensing.price?.amount}`}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
