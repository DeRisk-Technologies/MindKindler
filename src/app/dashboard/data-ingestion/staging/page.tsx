"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { StagedDocument } from '@/services/document-staging-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function StagingReviewPage() {
    const [docs, setDocs] = useState<StagedDocument[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'document_staging')); // In real app, filter by tenant
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: StagedDocument[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as StagedDocument);
            });
            setDocs(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="max-w-6xl mx-auto py-8">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Staging Review</h1>
             </div>
             
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead>Extracted Fields</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                                    <TableCell>{doc.documentType}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            doc.status === 'processed' ? 'default' :
                                            doc.status === 'ready_for_review' ? 'secondary' : 'outline'
                                        }>
                                            {doc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {Object.keys(doc.extractedData || {}).map(key => (
                                                <Badge key={key} variant="outline" className="text-[10px]">{key.split('.').pop()}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4 mr-1" /> Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {docs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No documents in staging.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    )
}
