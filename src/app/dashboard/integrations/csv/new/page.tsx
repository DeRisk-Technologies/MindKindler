"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { parseCSV, validateRows, processImport } from "@/integrations/csv/importer";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const SYSTEM_FIELDS = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'dateOfBirth', label: 'Date of Birth' },
    { value: 'email', label: 'Email' },
    { value: 'schoolId', label: 'School ID' },
    { value: 'gender', label: 'Gender' }
];

export default function CSVWizardPage() {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [validation, setValidation] = useState<{ valid: any[], errors: any[] } | null>(null);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            const data = await parseCSV(f);
            if (data.length > 0) {
                setHeaders(data[0]);
                setRows(data.slice(1, 6)); // Preview 5
                // Auto-map simple matches
                const autoMap: any = {};
                data[0].forEach(h => {
                    const match = SYSTEM_FIELDS.find(sf => sf.label.toLowerCase() === h.toLowerCase());
                    if (match) autoMap[h] = match.value;
                });
                setMapping(autoMap);
            }
        }
    };

    const handleValidate = () => {
        const res = validateRows([headers, ...rows], mapping, headers);
        setValidation(res);
        setStep(3);
    };

    const handleImport = async () => {
        setProcessing(true);
        try {
            // 1. Create Job
            const jobRef = await addDoc(collection(db, "importJobs"), {
                tenantId: "default",
                integrationId: "csv_manual",
                sourceType: "csv",
                entityType: "student",
                status: "validating",
                createdAt: new Date().toISOString(),
                initiatedByUserId: auth.currentUser?.uid || "unknown"
            });

            // 2. Process
            const allRows = await parseCSV(file!);
            const { valid } = validateRows(allRows, mapping, headers);
            
            await processImport(valid, 'student', jobRef.id);
            
            toast({ title: "Import Complete", description: `Processed ${valid.length} records.` });
            router.push(`/dashboard/integrations`);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Import Wizard: Students</h1>
            
            {/* Stepper */}
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= i ? 'bg-primary text-primary-foreground' : ''}`}>{i}</div>
                        <span className="font-medium">{i === 1 ? "Upload" : i === 2 ? "Map" : "Review"}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === 1 && (
                <Card>
                    <CardHeader><CardTitle>Upload CSV File</CardTitle></CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center relative hover:bg-slate-50">
                            <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                            <UploadCloud className="h-12 w-12 mb-4 text-slate-400" />
                            <p className="text-sm text-muted-foreground">{file ? file.name : "Drag & Drop or Click to Select"}</p>
                        </div>
                        {file && (
                            <div className="mt-4 flex justify-end">
                                <Button onClick={() => setStep(2)}>Next: Map Fields <ArrowRight className="ml-2 h-4 w-4"/></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Map */}
            {step === 2 && (
                <Card>
                    <CardHeader><CardTitle>Map Fields</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            {headers.map((h, i) => (
                                <div key={i} className="grid grid-cols-2 gap-4 items-center border-b pb-2">
                                    <div className="font-mono text-sm">{h}</div>
                                    <Select 
                                        value={mapping[h] || ""} 
                                        onValueChange={(v) => setMapping(prev => ({ ...prev, [h]: v }))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Ignore Column" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ignore">-- Ignore --</SelectItem>
                                            {SYSTEM_FIELDS.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleValidate}>Validate & Preview</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Validation */}
            {step === 3 && validation && (
                <Card>
                    <CardHeader><CardTitle>Validation Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded">
                                <CheckCircle2 className="h-5 w-5"/> {validation.valid.length} Valid Rows
                            </div>
                            <div className="flex items-center gap-2 text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded">
                                <AlertTriangle className="h-5 w-5"/> {validation.errors.length} Errors
                            </div>
                        </div>

                        {validation.errors.length > 0 && (
                            <div className="border rounded p-4 max-h-40 overflow-y-auto">
                                <h4 className="font-semibold text-sm mb-2">Error Log</h4>
                                {validation.errors.map((e, i) => (
                                    <div key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button onClick={handleImport} disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Import {validation.valid.length} Records
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
