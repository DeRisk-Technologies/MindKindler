"use client";

import { DocumentUploadDialog } from "@/components/dashboard/intelligence/document-upload-dialog";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { KnowledgeDocument } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function EvidenceVaultPage() {
    const { data: docs, loading } = useFirestoreCollection<KnowledgeDocument>("knowledgeDocuments", "createdAt", "desc");
    const [search, setSearch] = useState("");

    const evidence = docs.filter(d => d.type === 'evidence' && d.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Evidence Vault</h1>
                    <p className="text-muted-foreground">Curated research, guidelines, and trusted sources.</p>
                </div>
                <DocumentUploadDialog type="evidence" />
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search evidence..." 
                    className="max-w-sm" 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Trust Score</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Year</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline h-6 w-6" /></TableCell>
                                </TableRow>
                            )}
                            {!loading && evidence.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No evidence uploaded yet.</TableCell>
                                </TableRow>
                            )}
                            {evidence.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-indigo-500" />
                                        {doc.title}
                                    </TableCell>
                                    <TableCell className="capitalize">{doc.metadata.evidenceType}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 w-24">
                                            <Progress value={doc.metadata.trustScore || 0} className="h-2" />
                                            <span className="text-xs">{doc.metadata.trustScore}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {doc.metadata.verified ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <ShieldCheck className="h-3 w-3 mr-1"/> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{doc.metadata.publicationYear}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
