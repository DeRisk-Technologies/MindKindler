// src/components/cases/CaseList.tsx
"use client";

import { useEffect, useState } from "react";
import { Case, CaseStatus, CasePriority } from "@/types/schema";
import { listCases, updateCase } from "@/services/case-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
    tenantId: string;
    currentUserId: string;
}

export function CaseList({ tenantId, currentUserId }: Props) {
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState<Case[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterOwner, setFilterOwner] = useState<string>("all");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // Fetch all and filter client side for MVP simplicity, or implement complex query
                const result = await listCases(tenantId); 
                setCases(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tenantId]);

    const filteredCases = cases.filter(c => {
        if (filterStatus !== "all" && c.status !== filterStatus) return false;
        if (filterOwner === "me" && c.assignedTo !== currentUserId) return false;
        return true;
    });

    const handleQuickAssign = async (caseId: string) => {
        // Optimistic UI
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, assignedTo: currentUserId } : c));
        await updateCase(tenantId, caseId, { assignedTo: currentUserId }, currentUserId);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="triage">Triage</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="me">Assigned to Me</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCases.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.title}</TableCell>
                                <TableCell>
                                    <Badge variant={c.priority === 'Critical' ? 'destructive' : 'secondary'}>
                                        {c.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                                <TableCell>{c.slaDueAt ? new Date(c.slaDueAt).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{c.assignedTo || 'Unassigned'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    {!c.assignedTo && (
                                        <Button size="sm" variant="ghost" onClick={() => handleQuickAssign(c.id)}>
                                            Assign to Me
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/cases/${c.id}`}>View <ArrowRight className="ml-1 h-3 w-3"/></Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No cases found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
