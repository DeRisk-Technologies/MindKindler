"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Briefcase } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function PartnerApplyPage() {
    const [orgName, setOrgName] = useState("");
    const [website, setWebsite] = useState("");
    const [country, setCountry] = useState("UK");
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!orgName) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "partners"), {
                orgName,
                website,
                country,
                contactEmail: auth.currentUser?.email, // Mock auth linkage
                status: "applied",
                certificationLevel: "none",
                specialties: [],
                regionsServed: [country],
                createdAt: new Date().toISOString()
            });

            // Mock User Role Link
            if (auth.currentUser) {
                // In real app, cloud function would handle this
                // await addDoc(collection(db, "partnerUsers"), { userId: auth.currentUser.uid, role: 'partnerAdmin' });
            }

            toast({ title: "Application Submitted", description: "We will review your profile shortly." });
            router.push("/dashboard/partner-portal"); // Redirect to portal (will show pending state)
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto space-y-8">
            <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-indigo-600"/>
                <h1 className="text-3xl font-bold">Partner Program</h1>
                <p className="text-muted-foreground">Join the MindKindler ecosystem as a certified consultancy.</p>
            </div>

            <Card>
                <CardHeader><CardTitle>Organization Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Organization Name</Label>
                        <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Education" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Website</Label>
                        <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="grid gap-2">
                        <Label>Primary Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="NG">Nigeria</SelectItem>
                                <SelectItem value="UAE">UAE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit Application
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
