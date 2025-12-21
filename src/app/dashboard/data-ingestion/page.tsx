"use client";

import { DocumentUploader } from "@/components/dashboard/data-ingestion/document-uploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { UploadedDocument } from "@/types/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileCheck, AlertTriangle, RefreshCw, User, Building, Briefcase } from "lucide-react";

export default function DataIngestionPage() {
  const { data: documents, loading } = useFirestoreCollection<UploadedDocument>("documents", "createdAt", "desc");

  return (
    <div className="space-y-8 p-8 pt-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Data Ingestion</h1>
            <p className="text-muted-foreground">Upload and digitize educational records using AI.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
                <DocumentUploader />
            </div>
            
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Processing Queue</CardTitle>
                        <CardDescription>Status of uploaded documents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc: any) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{doc.fileName}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{doc.category.replace('_', ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                {doc.targetType === 'student' && <User className="h-3 w-3 text-muted-foreground" />}
                                                {doc.targetType === 'school' && <Building className="h-3 w-3 text-muted-foreground" />}
                                                {doc.targetType === 'user' && <Briefcase className="h-3 w-3 text-muted-foreground" />}
                                                {doc.targetName || "Unknown"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {doc.status === 'processing' && <Badge variant="outline" className="animate-pulse">Processing</Badge>}
                                            {doc.status === 'review_required' && <Badge variant="destructive">Review Needed</Badge>}
                                            {doc.status === 'processed' && <Badge variant="default" className="bg-green-600">Processed</Badge>}
                                            {doc.status === 'uploading' && <Badge variant="secondary">Uploading</Badge>}
                                            {doc.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {doc.status === 'review_required' ? (
                                                <Button size="sm" variant="outline" className="border-orange-500 text-orange-600">
                                                    <FileCheck className="mr-2 h-4 w-4" /> Review
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && documents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No documents found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
