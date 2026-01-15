import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone'; // Assuming react-dropzone is installed or mocked
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ClerkAgent } from '@/lib/ai/clerk-agent';
import { EvidenceItem, IngestionAnalysis } from '@/types/evidence';

interface EvidenceUploadZoneProps {
    onAnalysisComplete: (files: EvidenceItem[], analysis: IngestionAnalysis[]) => void;
}

// Mock Types for UI State
interface FileUploadState {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'scanning' | 'complete' | 'error';
    analysis?: IngestionAnalysis;
}

export function EvidenceUploadZone({ onAnalysisComplete }: EvidenceUploadZoneProps) {
    const [uploads, setUploads] = useState<FileUploadState[]>([]);
    
    // Simulate the AI Agent
    const processFiles = async (acceptedFiles: File[]) => {
        const newUploads = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'uploading' as const
        }));

        setUploads(prev => [...prev, ...newUploads]);

        // Simulate Upload & Scan Process for each file
        const results: IngestionAnalysis[] = [];
        const evidenceItems: EvidenceItem[] = [];

        for (const upload of newUploads) {
            // 1. Simulate Upload
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 50, status: 'scanning' } : u));
            await new Promise(r => setTimeout(r, 800)); // Fake network

            // 2. Simulate AI Scan
            const agent = new ClerkAgent();
            // In reality, we'd read the file content here
            const analysis = await agent.analyzeDocument("Mock Text content...", upload.file.name);
            
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: 'complete', analysis } : u));
            
            results.push(analysis);
            evidenceItems.push({
                id: upload.id,
                caseId: 'current-case',
                tenantId: 'tenant-1',
                filename: upload.file.name,
                storagePath: `/uploads/${upload.file.name}`,
                uploadDate: new Date().toISOString(),
                category: analysis.suggestedCategory,
                extractionStatus: 'processed',
                isVerified: false
            });
        }

        // Trigger parent callback when all done
        onAnalysisComplete(evidenceItems, results);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        processFiles(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div 
                {...getRootProps()} 
                className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                    isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                        <Upload className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Drag & Drop Case Files</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            PDFs, Word Docs, or Images. We'll scan them automatically.
                        </p>
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Secure NHS/Gov Grade Encryption
                    </p>
                </div>
            </div>

            {/* File List */}
            {uploads.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Processed Evidence</h4>
                    {uploads.map((upload) => (
                        <Card key={upload.id} className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded text-gray-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium truncate">{upload.file.name}</span>
                                    <span className="text-xs text-gray-500 capitalize">{upload.status}</span>
                                </div>
                                <Progress value={upload.progress} className="h-1.5" />
                            </div>

                            <div className="w-8 flex justify-center">
                                {upload.status === 'scanning' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                                {upload.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
