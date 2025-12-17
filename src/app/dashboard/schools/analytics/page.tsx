"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SchoolAnalyticsPage() {
  const gradePerformance = [
      { grade: 'Grade 3', avgMath: 78, avgReading: 82 },
      { grade: 'Grade 4', avgMath: 75, avgReading: 80 },
      { grade: 'Grade 5', avgMath: 68, avgReading: 79 }, // Dip
      { grade: 'Grade 6', avgMath: 74, avgReading: 81 },
  ];

  const riskDistribution = [
      { name: 'Low Risk', value: 400 },
      { name: 'Medium Risk', value: 150 },
      { name: 'High Risk', value: 50 },
  ];
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 p-8 pt-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">District Overview</h1>
            <p className="text-muted-foreground">Population-level trends and systemic issues.</p>
        </div>

        <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">Systemic Alert</AlertTitle>
            <AlertDescription className="text-red-600">
                Grade 5 Math scores are consistently 10% lower than the district average. Recommended Action: Review Grade 5 Math Curriculum implementation.
            </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Performance by Grade</CardTitle>
                    <CardDescription>Average scores across all schools.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradePerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="grade" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="avgMath" fill="#8884d8" name="Math" />
                            <Bar dataKey="avgReading" fill="#82ca9d" name="Reading" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Risk Stratification</CardTitle>
                    <CardDescription>Student population by intervention need.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={riskDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {riskDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
