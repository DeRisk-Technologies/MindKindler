"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, AlertTriangle, XCircle, GraduationCap, PlayCircle, Trophy, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Certification, TrainingModule } from "@/types/schema";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

export default function MyLearningPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("compliance");

    // Fetch Certifications
    const { data: certifications } = useFirestoreCollection<Certification>(
        'certifications', 
        'expiryDate', 
        'asc',
        { filter: user?.uid ? { field: 'userId', operator: '==', value: user.uid } : undefined }
    );

    // Fetch Training Modules
    const { data: modules } = useFirestoreCollection<TrainingModule>(
        'trainingModules',
        'createdAt',
        'desc',
        { filter: user?.uid ? { field: 'assignedUserId', operator: '==', value: user.uid } : undefined }
    );

    const getStatusColor = (status: string, expiry?: string) => {
        if (status === 'expired') return 'text-red-600 bg-red-50 border-red-200';
        if (status === 'revoked') return 'text-slate-600 bg-slate-50 border-slate-200';
        
        // Check dates
        if (expiry) {
            const daysLeft = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 3600 * 24));
            if (daysLeft < 0) return 'text-red-600 bg-red-50 border-red-200';
            if (daysLeft < 90) return 'text-amber-600 bg-amber-50 border-amber-200';
        }
        return 'text-green-600 bg-green-50 border-green-200';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Professional Development</h1>
                    <p className="text-muted-foreground">Manage your compliance and continuous learning.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><GraduationCap className="mr-2 h-4 w-4"/> Transcript</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="compliance">My Compliance</TabsTrigger>
                    <TabsTrigger value="coaching">AI Coach</TabsTrigger>
                </TabsList>

                {/* 1. COMPLIANCE TAB */}
                <TabsContent value="compliance" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {certifications.map(cert => {
                            const style = getStatusColor(cert.status, cert.expiryDate);
                            return (
                                <Card key={cert.id} className={`border-l-4 ${style.replace('text', 'border')}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="bg-white">{cert.issuer}</Badge>
                                            {cert.status === 'active' ? <ShieldCheck className="h-5 w-5 text-green-600"/> : <AlertTriangle className="h-5 w-5 text-amber-600"/>}
                                        </div>
                                        <CardTitle className="text-lg mt-2">{cert.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm space-y-1">
                                            <p className="text-muted-foreground">Ref: {cert.referenceNumber}</p>
                                            <p className={`font-semibold ${style.split(' ')[0]}`}>
                                                Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button size="sm" variant="ghost" className="w-full">Update Evidence</Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                        
                        {/* Add New Card */}
                        <Card className="border-dashed flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:bg-slate-50">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                                <ShieldCheck className="h-6 w-6 text-indigo-600" />
                            </div>
                            <p className="font-semibold text-indigo-900">Add Certification</p>
                            <p className="text-xs text-muted-foreground">Upload HCPC / DBS</p>
                        </Card>
                    </div>
                </TabsContent>

                {/* 2. AI COACH TAB */}
                <TabsContent value="coaching" className="space-y-6">
                    {/* Gap Scanner Alert */}
                    <Alert className="bg-indigo-50 border-indigo-200">
                        <Trophy className="h-4 w-4 text-indigo-600" />
                        <AlertTitle className="text-indigo-900">Performance Insight</AlertTitle>
                        <AlertDescription className="text-indigo-800">
                            The AI Gap Scanner has identified <strong>2 areas</strong> for improvement based on your recent report edits. Complete these micro-courses to earn badges.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-4">
                        {modules.map(module => (
                            <Card key={module.id} className="group hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row">
                                    <div className="flex-1 p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                    {module.generatedBy === 'ai_gap_scanner' ? 'AI Recommended' : 'Mandatory'}
                                                </Badge>
                                                <h3 className="text-xl font-bold">{module.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                            </div>
                                            {module.status === 'completed' && <Trophy className="h-8 w-8 text-yellow-500" />}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{module.progressPercent || 0}%</span>
                                            </div>
                                            <Progress value={module.progressPercent || 0} className="h-2" />
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                            <BookOpen className="h-4 w-4" /> 
                                            Rationale: {module.rationale || "General upskilling"}
                                        </div>
                                    </div>
                                    <div className="p-6 flex items-center justify-center border-t md:border-l md:border-t-0 bg-slate-50 min-w-[200px]">
                                        <Button onClick={() => router.push(`/dashboard/training/lesson/${module.id}`)}>
                                            {module.status === 'completed' ? 'Review' : 'Start Lesson'} <PlayCircle className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
