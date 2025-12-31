"use client";

import { DocumentUploadDialog } from "@/components/dashboard/intelligence/document-upload-dialog";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { KnowledgeDocument } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Book, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ProfessionalLibraryPage() {
    const { data: docs, loading } = useFirestoreCollection<KnowledgeDocument>("knowledgeDocuments", "createdAt", "desc");
    const [search, setSearch] = useState("");

    const reports = docs.filter(d => d.type === 'report' && d.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Professional Library</h1>
                    <p className="text-muted-foreground">Past reports, research papers, and templates.</p>
                </div>
                <DocumentUploadDialog type="report" />
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search reports..." 
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
                                <TableHead>Status</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead>Uploaded</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin inline h-6 w-6" /></TableCell>
                                </TableRow>
                            )}
                            {!loading && reports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No reports uploaded yet.</TableCell>
                                </TableRow>
                            )}
                            {reports.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Book className="h-4 w-4 text-green-600" />
                                        {doc.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={doc.status === 'indexed' ? 'default' : 'secondary'} className="capitalize">
                                            {doc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{doc.visibility}</TableCell>
                                    <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
