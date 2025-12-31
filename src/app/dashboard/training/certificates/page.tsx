"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Certificate } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Download, Award } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CertificatesPage() {
    const { data: certs, loading } = useFirestoreCollection<Certificate>("certificates", "issuedAt", "desc");
    const router = useRouter();

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Certificates</h1>
                <p className="text-muted-foreground">Proof of professional development and CPD hours.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-800">Total Hours</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-yellow-900">{certs.reduce((acc, c) => acc + c.hoursAwarded, 0)} hrs</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Certificates Earned</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{certs.length}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Issued</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {certs.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Award className="h-4 w-4 text-orange-500"/> {c.title}
                                    </TableCell>
                                    <TableCell>{new Date(c.issuedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{c.hoursAwarded}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{c.verificationCode}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/training/certificates/${c.id}`)}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
