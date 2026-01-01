// src/components/upload/BulkUploader.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface BulkRow {
    fileName: string;
    studentId: string;
    category: string;
    valid: boolean;
    error?: string;
}

export function BulkUploader({ tenantId }: { tenantId: string }) {
    const [manifest, setManifest] = useState<BulkRow[]>([]);
    
    // Mock parsing of CSV
    const onDrop = (files: File[]) => {
        const mockParsed: BulkRow[] = [
            { fileName: 'report_A.pdf', studentId: 's1', category: 'academic', valid: true },
            { fileName: 'report_B.pdf', studentId: '', category: 'academic', valid: false, error: 'Missing Student ID' }
        ];
        setManifest(mockParsed);
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

    return (
        <div className="space-y-4">
            <div {...getRootProps()} className="border border-dashed p-6 rounded text-center cursor-pointer hover:bg-slate-50">
                <input {...getInputProps()} />
                <FileSpreadsheet className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-sm font-medium">Upload Manifest (CSV)</p>
                <p className="text-xs text-muted-foreground">Format: filename, student_id, category</p>
            </div>

            {manifest.length > 0 && (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {manifest.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.fileName}</TableCell>
                                        <TableCell>{row.studentId || '-'}</TableCell>
                                        <TableCell>
                                            {row.valid 
                                                ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Ready</span>
                                                : <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {row.error}</span>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t">
                            <Button className="w-full" disabled={manifest.some(r => !r.valid)}>Start Bulk Import</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
