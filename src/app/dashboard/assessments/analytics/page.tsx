"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AssessmentAnalyticsPage() {
  const data = [
      { name: 'Reading', avgScore: 65, highRisk: 12 },
      { name: 'Math', avgScore: 72, highRisk: 8 },
      { name: 'Science', avgScore: 68, highRisk: 10 },
      { name: 'Behavior', avgScore: 85, highRisk: 5 },
  ];

  return (
    <div className="space-y-8 p-8 pt-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Analytics</h1>
          <p className="text-muted-foreground">Aggregate performance data and anomaly detection.</p>
       </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {/* Summary Cards */}
       </div>

       <Alert variant="destructive" className="bg-red-50 border-red-200">
           <AlertTriangle className="h-4 w-4 text-red-800" />
           <AlertTitle className="text-red-900">Anomaly Detected</AlertTitle>
           <AlertDescription className="text-red-800">
               Grade 5 Reading scores have dropped by 15% compared to last term. Recommended action: Review curriculum alignment.
           </AlertDescription>
       </Alert>

       <Card>
           <CardHeader>
               <CardTitle>Average Scores by Category</CardTitle>
               <CardDescription>Performance distribution across key learning areas.</CardDescription>
           </CardHeader>
           <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="avgScore" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Avg Score" />
                    <Bar dataKey="highRisk" fill="#ef4444" radius={[4, 4, 0, 0]} name="High Risk Count" />
                 </BarChart>
              </ResponsiveContainer>
           </CardContent>
       </Card>
    </div>
  );
}
