"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { InterventionPlan } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateOutcomeStats } from "@/analytics/interventions";
import { Loader2, School } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function SchoolOutcomesPage() {
    const { data: plans, loading } = useFirestoreCollection<InterventionPlan>("interventionPlans");
    const [selectedSchool, setSelectedSchool] = useState("all");

    // Mock school filtering (real app would use user's orgId)
    // For demo, we just aggregate everything
    const filteredPlans = selectedSchool === 'all' ? plans : plans.filter(p => p.studentId.startsWith('mock')); // Mock logic

    const stats = calculateOutcomeStats(filteredPlans);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">School Outcomes</h1>
                    <p className="text-muted-foreground">Aggregated impact analysis for school administrators.</p>
                </div>
                <div className="w-[200px]">
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                        <SelectTrigger><SelectValue placeholder="Select School" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Schools</SelectItem>
                            <SelectItem value="s1">Springfield Elementary</SelectItem>
                            <SelectItem value="s2">Riverside High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Total Students Supported</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">{stats.totalPlans}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Intervention Success Rate</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-green-600">
                        {stats.totalPlans > 0 ? ((stats.improvingCount / stats.totalPlans) * 100).toFixed(0) : 0}%
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Plans Completed</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">{stats.completedPlans}</CardContent>
                </Card>
            </div>

            <Card className="bg-slate-50 border-dashed">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <School className="h-12 w-12 mb-4 opacity-20"/>
                    <h3 className="font-semibold">Privacy Protection Active</h3>
                    <p className="text-sm max-w-md">Student-level details are hidden in this view. Aggregated data is provided for strategic planning.</p>
                </CardContent>
            </Card>
        </div>
    );
}
