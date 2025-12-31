"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DocAIDashboard() {
    const { data: runs, loading } = useFirestoreCollection<any>("docExtractionRuns", "createdAt", "desc");
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Document AI</h1>
                    <p className="text-muted-foreground">Extract structured data from PDF, Image, and Scans.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/integrations/document-ai/new')}>
                    <Plus className="mr-2 h-4 w-4"/> New Extraction
                </Button>
            </div>

            <Card>
                <CardHeader><CardTitle>Recent Extractions</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>
                            )}
                            {runs.map(run => (
                                <TableRow key={run.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500"/> {run.fileName}
                                    </TableCell>
                                    <TableCell className="capitalize">{run.category}</TableCell>
                                    <TableCell><Badge variant={run.status === 'approved' ? 'default' : 'outline'}>{run.status}</Badge></TableCell>
                                    <TableCell>{new Date(run.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/integrations/document-ai/${run.id}`)}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && runs.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No documents processed yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
