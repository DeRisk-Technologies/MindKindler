"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { commitRun, applyCorrections } from "@/integrations/documentAI/pipeline"; // Need to export applyCorrections if implementing feedback
import { useToast } from "@/hooks/use-toast";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ReviewRunPage() {
    const { runId } = useParams() as { runId: string };
    const { data: run, loading } = useFirestoreDocument<any>("docExtractionRuns", runId);
    const router = useRouter();
    const { toast } = useToast();
    const [edits, setEdits] = useState<Record<number, Record<string, string>>>({});
    const [approving, setApproving] = useState(false);

    if (loading || !run) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    const headers = Object.keys(run.extractedDataPreview.rows[0] || {});
    const rows = run.extractedDataPreview.rows;

    const handleCellEdit = (rowIndex: number, header: string, val: string) => {
        setEdits(prev => ({
            ...prev,
            [rowIndex]: {
                ...(prev[rowIndex] || {}),
                [header]: val
            }
        }));
    };

    const handleApprove = async () => {
        setApproving(true);
        try {
            // Merge Edits
            const finalData = rows.map((r: any, i: number) => {
                const rowEdits = edits[i] || {};
                const merged: any = {};
                headers.forEach(h => {
                    merged[h] = { value: rowEdits[h] !== undefined ? rowEdits[h] : r[h].value };
                });
                return merged;
            });

            // If category is results, assume result import, else student (mock)
            const type = run.category === 'results' ? 'result' : 'student';
            
            await commitRun(runId, finalData, type as any);
            toast({ title: "Imported", description: "Data successfully ingested." });
            router.push('/dashboard/integrations/document-ai');
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
            setApproving(false);
        }
    };

    return (
        <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                    <div>
                        <h1 className="text-2xl font-bold">Review Extraction</h1>
                        <p className="text-muted-foreground">{run.fileName} • {run.category}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
                        {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                        Approve & Import
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
                {/* Source View (Mock Placeholder) */}
                <Card className="flex flex-col bg-slate-100 border-dashed">
                    <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                        PDF Preview Placeholder
                    </CardContent>
                </Card>

                {/* Data Grid */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="py-3 bg-slate-50 border-b"><CardTitle className="text-sm">Extracted Data ({rows.length} Rows)</CardTitle></CardHeader>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {headers.map(h => <TableHead key={h} className="min-w-[150px]">{h}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        {headers.map(h => {
                                            const cell = row[h];
                                            const editedVal = edits[i]?.[h];
                                            const val = editedVal !== undefined ? editedVal : cell.value;
                                            const lowConf = cell.confidence < 0.85;

                                            return (
                                                <TableCell key={h} className={`p-1 ${lowConf ? 'bg-yellow-50' : ''}`}>
                                                    <Input 
                                                        value={val} 
                                                        onChange={e => handleCellEdit(i, h, e.target.value)} 
                                                        className="h-8 text-xs border-transparent hover:border-input focus:border-primary"
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
