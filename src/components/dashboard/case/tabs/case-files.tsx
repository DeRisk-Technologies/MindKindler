// src/components/dashboard/case/tabs/case-files.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Lock, Eye } from 'lucide-react';
import { DocumentUploader } from '@/components/dashboard/data-ingestion/document-uploader'; 

export function CaseFiles({ caseId }: { caseId: string }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">The Digital Case File (Forensic View)</h3>
                <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Ingest Zip / PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* File Tree / Timeline */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Document Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for Document List */}
                        <div className="space-y-2">
                            <div className="p-3 border rounded-lg flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium">Request for Advice.pdf</p>
                                        <p className="text-xs text-muted-foreground">Local Authority • 2 days ago</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon"><Eye className="w-4 h-4"/></Button>
                            </div>
                            <div className="p-3 border rounded-lg flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-medium">Parental Advice (Sec A).docx</p>
                                        <p className="text-xs text-muted-foreground">Parent • 2 days ago</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon"><Eye className="w-4 h-4"/></Button>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-4 border-t border-dashed">
                            <p className="text-sm font-medium mb-2">Upload New Evidence</p>
                            <DocumentUploader /> 
                        </div>
                    </CardContent>
                </Card>

                {/* Extracted Stakeholders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Detected Stakeholders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="text-sm">
                                <p className="font-medium">Mrs. Smith (Parent)</p>
                                <p className="text-xs text-muted-foreground">Source: Parental Advice.docx</p>
                                <Badge variant="outline" className="mt-1 text-[10px]">Consent Pending</Badge>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium">Dr. Jones (Pediatrician)</p>
                                <p className="text-xs text-muted-foreground">Source: Clinic_Letter_2024.pdf</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { Badge } from '@/components/ui/badge';
