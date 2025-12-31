"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { PartnerOrg } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Shield, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PartnerAdminPage() {
    const { data: partners, loading } = useFirestoreCollection<PartnerOrg>("partners", "createdAt", "desc");
    const router = useRouter();
    const { toast } = useToast();

    const handleApprove = async (id: string) => {
        await updateDoc(doc(db, "partners", id), { status: "approved", certificationLevel: "bronze" });
        toast({ title: "Partner Approved" });
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Partner Management</h1>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.orgName}</TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Globe className="h-3 w-3"/> {p.country}</div></TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${p.certificationLevel === 'gold' ? 'border-yellow-400 text-yellow-600' : ''}`}>
                                            {p.certificationLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant={p.status === 'approved' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        {p.status === 'applied' && (
                                            <Button size="sm" onClick={() => handleApprove(p.id)}><Check className="mr-2 h-4 w-4"/> Approve</Button>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/partners/${p.id}`)}>Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && partners.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">No partners found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
