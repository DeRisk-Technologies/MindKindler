// src/components/reporting/modals/ExportOptionsModal.tsx
"use client";

import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Lock, FileType, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocxGenerator } from '@/lib/export/docx-generator';
import { ReportService } from '@/services/report-service'; // Assumed exist for PDF

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any; // Full Report Object
    tenantName: string;
}

export function ExportOptionsModal({ isOpen, onClose, report, tenantName }: ExportOptionsModalProps) {
    const { toast } = useToast();
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            if (format === 'docx') {
                // Client-side DOCX Generation
                const blob = await DocxGenerator.generate(report, tenantName);
                DocxGenerator.save(blob, `${report.title.replace(/\s+/g, '_')}_Final.docx`);
                toast({ title: "Export Complete", description: "DOCX downloaded." });
            } else {
                // Server-side PDF Generation (Secure)
                const { downloadUrl } = await ReportService.exportReport(report.tenantId, report.id, { 
                    redactionLevel: 'none', 
                    format: 'pdf' 
                });
                window.open(downloadUrl, '_blank');
                toast({ title: "Export Complete", description: "PDF opened in new tab." });
            }
            onClose();
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Export Failed", description: "Could not generate document." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Report</DialogTitle>
                    <DialogDescription>
                        Choose the format required by the receiving agency.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <RadioGroup defaultValue="pdf" value={format} onValueChange={(v: any) => setFormat(v)} className="grid grid-cols-1 gap-4">
                        
                        {/* Option 1: PDF */}
                        <div>
                            <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                            <Label
                                htmlFor="pdf"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-indigo-600" />
                                        <div className="font-semibold">Secure PDF</div>
                                    </div>
                                    <FileText className="h-4 w-4 opacity-50" />
                                </div>
                                <span className="text-xs text-muted-foreground mt-2 w-full">
                                    Read-only format. Best for Parents and Schools to prevent tampering.
                                </span>
                            </Label>
                        </div>

                        {/* Option 2: DOCX */}
                        <div>
                            <RadioGroupItem value="docx" id="docx" className="peer sr-only" />
                            <Label
                                htmlFor="docx"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileType className="h-5 w-5 text-blue-600" />
                                        <div className="font-semibold">LA Source File (.docx)</div>
                                    </div>
                                    <FileText className="h-4 w-4 opacity-50" />
                                </div>
                                <span className="text-xs text-muted-foreground mt-2 w-full">
                                    Editable format. Required by Local Authority for copying into EHCP.
                                </span>
                            </Label>
                        </div>

                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isExporting} className="bg-indigo-600">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-4 w-4"/>}
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
