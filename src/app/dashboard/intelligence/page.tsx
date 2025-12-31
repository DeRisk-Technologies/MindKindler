"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, Shield, UserCog, Search, ArrowRight, Database, ShieldAlert, Gavel, Scale, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IntelligenceHubPage() {
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Intelligence Hub</h1>
                <p className="text-muted-foreground">Centralized knowledge vault, compliance rules, and query engine.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/intelligence/query')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ask the Vault</CardTitle>
                        <Search className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Query</div>
                        <p className="text-xs text-muted-foreground">Search across all rules and reports with AI.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/intelligence/vault')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rulebook Vault</CardTitle>
                        <Shield className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Documents</div>
                        <p className="text-xs text-muted-foreground">Official regulations and policies.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/intelligence/library')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Professional Library</CardTitle>
                        <Book className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Reports</div>
                        <p className="text-xs text-muted-foreground">Past cases, templates, and research.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/intelligence/rule-drafts')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rule Drafts</CardTitle>
                        <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Suggestions</div>
                        <p className="text-xs text-muted-foreground">AI-extracted compliance rules.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Governance Section */}
            <h3 className="text-lg font-semibold pt-4">Governance & Compliance</h3>
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => router.push('/dashboard/intelligence/policy-manager')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Scale className="h-4 w-4"/> Policy Manager
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Define and enforce compliance rules (Advisory/Enforce).</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => router.push('/dashboard/intelligence/compliance')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Gavel className="h-4 w-4"/> Compliance Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Review findings and approve override requests.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500" onClick={() => router.push('/dashboard/intelligence/safeguarding')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4"/> Safeguarding
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Manage and escalate high-risk incidents.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                <Database className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Knowledge Graph Status</h3>
                <div className="flex gap-4">
                    <Badge variant="secondary">Mock Vector Store Active</Badge>
                    <Badge variant="outline">0 Nodes Indexed</Badge>
                </div>
            </div>
        </div>
    );
}
