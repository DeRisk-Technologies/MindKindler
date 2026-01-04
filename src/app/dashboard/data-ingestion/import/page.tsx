"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Database, ArrowRight, Loader2 } from 'lucide-react';
import { LmsConnectorStub, ImportedStudent } from '@/integrations/connectors/lms-connector-stub';
import { DocumentStagingService } from '@/services/document-staging-service';
import { OcrProcessor } from '@/integrations/ocr/processor';
import { useToast } from '@/hooks/use-toast';

export default function DataIngestionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'lms'>('upload');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lmsResults, setLmsResults] = useState<ImportedStudent[]>([]);
  const { toast } = useToast();

  // --- Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsProcessing(true);
    try {
      // 1. Create Staged Record
      const stagedId = await DocumentStagingService.createStagedDocument('tenant-1', {
        fileName: uploadFile.name,
        fileRef: `uploads/${uploadFile.name}`, // Fake path
        mimeType: uploadFile.type,
        uploadedBy: 'user-1'
      });

      // 2. Trigger OCR (Client-side trigger for demo)
      await OcrProcessor.processDocument(stagedId, uploadFile.name);

      toast({
        title: "File Processed",
        description: "Document uploaded and processed. Review extraction in staging.",
      });
      setUploadFile(null);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LMS Handlers ---
  const handleLmsFetch = async () => {
    setIsProcessing(true);
    try {
      const results = await LmsConnectorStub.fetchStudentRoster('school-1');
      setLmsResults(results);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Ingestion</h1>
        <p className="text-muted-foreground mt-2">
          Import student data from documents or external school systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selection Cards */}
        <Card 
            className={`cursor-pointer hover:border-primary transition-all ${activeTab === 'upload' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setActiveTab('upload')}
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Document OCR
                </CardTitle>
                <CardDescription>Upload birth certificates, reports, or IEPs.</CardDescription>
            </CardHeader>
        </Card>

        <Card 
             className={`cursor-pointer hover:border-primary transition-all ${activeTab === 'lms' ? 'border-primary ring-1 ring-primary' : ''}`}
             onClick={() => setActiveTab('lms')}
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-500" />
                    School Sync
                </CardTitle>
                <CardDescription>Connect to SIMS, PowerSchool, or OneRoster.</CardDescription>
            </CardHeader>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardContent className="pt-6">
            {activeTab === 'upload' && (
                <div className="space-y-4 max-w-md">
                    <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center bg-gray-50">
                        <Upload className="h-10 w-10 text-gray-400 mb-4" />
                        <h3 className="font-semibold text-lg">Upload Document</h3>
                        <p className="text-sm text-gray-500 mb-4">Drag and drop or select file</p>
                        <Input type="file" onChange={handleFileChange} />
                    </div>
                    <Button onClick={handleUpload} disabled={!uploadFile || isProcessing} className="w-full">
                        {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Process Document
                    </Button>
                </div>
            )}

            {activeTab === 'lms' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">School Roster Import</h3>
                        <Button onClick={handleLmsFetch} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Fetch Roster'}
                        </Button>
                    </div>

                    {lmsResults.length > 0 && (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"><Checkbox /></TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>DOB</TableHead>
                                        <TableHead>School</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lmsResults.map((s) => (
                                        <TableRow key={s.externalId}>
                                            <TableCell><Checkbox /></TableCell>
                                            <TableCell className="font-mono text-xs">{s.externalId}</TableCell>
                                            <TableCell>{s.firstName} {s.lastName}</TableCell>
                                            <TableCell>{s.dob}</TableCell>
                                            <TableCell>{s.schoolName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700">Ready</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-4 bg-gray-50 flex justify-end">
                                <Button>Import Selected ({lmsResults.length})</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
