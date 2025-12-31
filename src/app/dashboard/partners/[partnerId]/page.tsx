"use client";

import { useFirestoreDocument, useFirestoreCollection } from "@/hooks/use-firestore";
import { PartnerOrg, DealRegistration } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShieldCheck, Ban } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PartnerDetailPage() {
    const { partnerId } = useParams() as { partnerId: string };
    const { data: partner, loading } = useFirestoreDocument<PartnerOrg>("partners", partnerId);
    // const { data: deals } = useFirestoreCollection<DealRegistration>("dealRegistrations"); // Should filter
    const router = useRouter();
    const { toast } = useToast();

    if (loading || !partner) return <div>Loading...</div>;

    const handleUpdateLevel = async (level: string) => {
        await updateDoc(doc(db, "partners", partnerId), { certificationLevel: level });
        toast({ title: "Level Updated" });
    };

    const handleSuspend = async () => {
        if (!confirm("Suspend this partner?")) return;
        await updateDoc(doc(db, "partners", partnerId), { status: "suspended" });
        toast({ title: "Partner Suspended" });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold">{partner.orgName}</h1>
                    <div className="flex gap-2 mt-2">
                        <Badge>{partner.status}</Badge>
                        <Badge variant="outline">{partner.country}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Certification</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Current Level</span>
                            <Badge className="capitalize bg-purple-100 text-purple-800 border-purple-200">{partner.certificationLevel}</Badge>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Change Level</label>
                            <Select onValueChange={handleUpdateLevel} defaultValue={partner.certificationLevel}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="bronze">Bronze</SelectItem>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="gold">Gold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="destructive" className="w-full" onClick={handleSuspend}>
                            <Ban className="mr-2 h-4 w-4"/> Suspend Partnership
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
