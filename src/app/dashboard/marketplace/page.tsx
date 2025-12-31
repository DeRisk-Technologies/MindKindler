"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Globe, Shield, BookOpen, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Mock Catalog Loader
import ukPack from "@/marketplace/catalog/uk_la_pack.json";
import usPack from "@/marketplace/catalog/us_district_pack.json";
import ngPack from "@/marketplace/catalog/nigeria_foundation_pack.json";
import dachPack from "@/marketplace/catalog/dach_pack.json";
import gulfPack from "@/marketplace/catalog/gulf_pack.json";

const CATALOG = [ukPack, usPack, ngPack, dachPack, gulfPack];

export default function MarketplacePage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterRegion, setFilterRegion] = useState("All");

    const filteredPacks = CATALOG.filter(p => 
        (filterRegion === "All" || p.regionTags.includes(filterRegion)) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    );

    const regions = Array.from(new Set(CATALOG.flatMap(p => p.regionTags)));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Integration Marketplace</h1>
                    <p className="text-muted-foreground">Accelerate deployment with pre-configured packs.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard/marketplace/installed')}>
                    Manage Installed
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search packs..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <Button variant={filterRegion === 'All' ? 'secondary' : 'ghost'} onClick={() => setFilterRegion('All')}>All</Button>
                    {regions.map(r => (
                        <Button key={r} variant={filterRegion === r ? 'secondary' : 'ghost'} onClick={() => setFilterRegion(r)}>{r}</Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPacks.map(pack => (
                    <Card key={pack.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="outline">{pack.version}</Badge>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <CardTitle className="mt-2">{pack.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground flex-1">{pack.description}</p>
                            <div className="flex gap-2 flex-wrap">
                                {pack.actions.some((a: any) => a.type === 'createPolicyRule') && <Badge variant="secondary" className="text-[10px]"><Shield className="h-3 w-3 mr-1"/> Policies</Badge>}
                                {pack.actions.some((a: any) => a.type === 'createTrainingModule') && <Badge variant="secondary" className="text-[10px]"><BookOpen className="h-3 w-3 mr-1"/> Training</Badge>}
                            </div>
                            <Button className="w-full mt-4" onClick={() => router.push(`/dashboard/marketplace/${pack.id}`)}>
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
