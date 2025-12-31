"use client";

import { useFirestoreCollection, useFirestoreDocument } from "@/hooks/use-firestore";
import { PartnerOrg, DealRegistration } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Users, DollarSign, Award, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function PartnerPortalPage() {
    const { toast } = useToast();
    const router = useRouter();
    // In real app, fetch partner for current user
    // Mock: fetch first partner or user specific
    const [myPartner, setMyPartner] = useState<PartnerOrg | null>(null);
    const [deals, setDeals] = useState<DealRegistration[]>([]);
    const [loading, setLoading] = useState(true);

    // Deal Form
    const [openDeal, setOpenDeal] = useState(false);
    const [prospect, setProspect] = useState("");
    const [value, setValue] = useState(0);

    useEffect(() => {
        const fetchContext = async () => {
            // Mock: find partner with matching email contact for current user
            // In prod: use partnerUsers collection
            if (!auth.currentUser?.email) return;
            const q = query(collection(db, "partners"), where("contactEmail", "==", auth.currentUser.email));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const p = { id: snap.docs[0].id, ...snap.docs[0].data() } as PartnerOrg;
                setMyPartner(p);

                // Fetch deals
                const dealQ = query(collection(db, "dealRegistrations"), where("partnerId", "==", p.id));
                const dealSnap = await getDocs(dealQ);
                setDeals(dealSnap.docs.map(d => ({ id: d.id, ...d.data() } as DealRegistration)));
            }
            setLoading(false);
        };
        fetchContext();
    }, []);

    const handleRegisterDeal = async () => {
        if (!myPartner) return;
        await addDoc(collection(db, "dealRegistrations"), {
            partnerId: myPartner.id,
            prospectOrgName: prospect,
            estimatedAnnualValue: value,
            stage: "lead",
            country: myPartner.country,
            createdByUserId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
        });
        toast({ title: "Deal Registered", description: "Sales team notified." });
        setOpenDeal(false);
        // Refresh logic would go here
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    if (!myPartner) {
        return (
            <div className="p-12 text-center space-y-4">
                <h2 className="text-2xl font-bold">Partner Program</h2>
                <p className="text-muted-foreground">You are not linked to a partner organization yet.</p>
                <Button onClick={() => router.push('/dashboard/partner-portal/apply')}>Apply Now</Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Partner Portal</h1>
                    <p className="text-muted-foreground">{myPartner.orgName} • <Badge variant="outline">{myPartner.certificationLevel.toUpperCase()}</Badge></p>
                </div>
                <Dialog open={openDeal} onOpenChange={setOpenDeal}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Register Deal</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Deal Registration</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Prospect Name</Label>
                                <Input value={prospect} onChange={e => setProspect(e.target.value)} placeholder="School / Ministry Name" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Est. Value (USD)</Label>
                                <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
                            </div>
                            <Button onClick={handleRegisterDeal}>Submit</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pipeline Value</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600"/> {deals.reduce((acc, d) => acc + d.estimatedAnnualValue, 0).toLocaleString()}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Deals</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Target className="h-4 w-4 text-blue-600"/> {deals.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold flex items-center gap-2">
                            {myPartner.status === 'approved' ? <span className="text-green-600 flex items-center gap-1"><Award className="h-4 w-4"/> Active Partner</span> : "Pending"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Deal Registrations</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prospect</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deals.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-medium">{d.prospectOrgName}</TableCell>
                                    <TableCell>${d.estimatedAnnualValue.toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline">{d.stage}</Badge></TableCell>
                                    <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {deals.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">No deals registered.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
