"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Map, CheckSquare, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrainingAdminPage() {
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Training Dashboard</h1>
                <p className="text-muted-foreground">Administer learning programs and track compliance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/training/library')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Library</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Modules</div>
                        <p className="text-xs text-muted-foreground">Create and manage content.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/training/paths')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
                        <Map className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Programs</div>
                        <p className="text-xs text-muted-foreground">Sequenced curriculums.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/training/assignments')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                        <CheckSquare className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tracking</div>
                        <p className="text-xs text-muted-foreground">Assign training to staff.</p>
                    </CardContent>
                </Card>
                <Card className="opacity-50 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                        <BarChart className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Reports</div>
                        <p className="text-xs text-muted-foreground">Coming in Phase 3E.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
