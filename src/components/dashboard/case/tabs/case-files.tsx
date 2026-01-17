// src/components/dashboard/case/tabs/case-files.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Eye, Loader2 } from 'lucide-react';
import { DocumentUploader } from '@/components/dashboard/data-ingestion/document-uploader'; 
import { Badge } from '@/components/ui/badge';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

export function CaseFiles({ caseId }: { caseId: string }) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDocs() {
            if (!user) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                const q = query(
                    collection(db, 'knowledgeDocuments'), 
                    where('caseId', '==', caseId)
                    // Note: Composite index needed for caseId + createdAt
                );
                
                const snap = await getDocs(q);
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort client side to avoid index requirement for now
                docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                setDocuments(docs);
            } catch (e) {
                console.error("Failed to fetch case files", e);
            } finally {
                setLoading(false);
            }
        }
        fetchDocs();
    }, [caseId, user]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">The Digital Case File (Forensic View)</h3>
                <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Add Evidence
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* File Tree / Timeline */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Document Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5"/></div>
                        ) : documents.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground border-2 border-dashed rounded">
                                No documents found. Upload the Zip file to start.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documents.map(doc => (
                                    <div key={doc.id} className="p-3 border rounded-lg flex items-center justify-between bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <FileText className={`w-5 h-5 ${doc.type === 'referral' ? 'text-blue-500' : 'text-slate-500'}`} />
                                            <div>
                                                <p className="text-sm font-medium">{doc.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(doc.createdAt))} ago • {doc.metadata?.evidenceType || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="w-4 h-4 text-slate-400 hover:text-indigo-600"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-4 p-4 border-t border-dashed">
                            <p className="text-sm font-medium mb-2">Upload New Evidence</p>
                            <DocumentUploader /> 
                        </div>
                    </CardContent>
                </Card>

                {/* Extracted Stakeholders (Mock for now, or link to CaseFile.stakeholders) */}
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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
