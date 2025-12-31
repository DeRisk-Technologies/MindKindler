"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { PolicyRuleDraft, KnowledgeDocument } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RuleDraftsPage() {
    const { data: drafts, loading } = useFirestoreCollection<PolicyRuleDraft>("policyRuleDrafts", "createdAt", "desc");
    const router = useRouter();
    
    // Fetch source doc titles
    const [docTitles, setDocTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchDocs = async () => {
            const docIds = Array.from(new Set(drafts.map(d => d.sourceDocumentId)));
            const titles: Record<string, string> = {};
            // Inefficient but ok for small mock data
            for (const id of docIds) {
                if (!id) continue;
                const snap = await getDocs(query(collection(db, "knowledgeDocuments"), where("id", "==", id))); // or direct getDoc if ID matches docID
                // Actually knowledgeDocuments IDs are auto-gen usually, so let's just assume we might miss some in this optimized loop
                // Better: rely on metadata in draft if available, or just fetch all docs
            }
            // For now, skip fetching title to keep it simple, or just show ID
        };
        fetchDocs();
    }, [drafts]);

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Rule Drafts</h1>
                <p className="text-muted-foreground">AI-extracted compliance rules pending review.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Suggested Title</TableHead>
                                <TableHead>Source Rulebook</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts.map(draft => (
                                <TableRow key={draft.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-purple-500" />
                                            {draft.structuredDraft?.title || "Untitled Draft"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">{draft.sourceDocumentId}</TableCell>
                                    <TableCell>
                                        <Badge variant={draft.confidence > 0.8 ? 'default' : 'secondary'}>
                                            {(draft.confidence * 100).toFixed(0)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{draft.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/intelligence/rule-drafts/${draft.id}`)}>
                                            Review <ChevronRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && drafts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No drafts found. Upload a rulebook to generate suggestions.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
