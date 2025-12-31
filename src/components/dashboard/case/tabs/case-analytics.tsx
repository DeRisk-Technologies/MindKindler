"use client";

import { Case } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface CaseAnalyticsProps {
  caseData: Case;
}

export function CaseAnalytics({ caseData }: CaseAnalyticsProps) {
  // Mock Data for Charts
  const readingData = [
    { name: "Sep", score: 45 },
    { name: "Oct", score: 52 },
    { name: "Nov", score: 49 },
    { name: "Dec", score: 58 },
    { name: "Jan", score: 65 },
  ];

  const behaviorData = [
    { name: "Sep", incidents: 5 },
    { name: "Oct", incidents: 8 }, // Spike
    { name: "Nov", incidents: 4 },
    { name: "Dec", incidents: 2 },
    { name: "Jan", incidents: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Progress Analytics</h3>
        <Select defaultValue="3months">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="year">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Alert Example */}
      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
        <AlertTriangle className="h-4 w-4 text-red-900" />
        <AlertTitle>Trend Alert</AlertTitle>
        <AlertDescription>
          Significant spike in behavior incidents detected in October. Correlates with reported bullying in school (Grade 5).
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reading Fluency Progress</CardTitle>
            <CardDescription>Words per minute (WPM)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavioral Incidents</CardTitle>
            <CardDescription>Reported disruptions per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={behaviorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="incidents" fill="#adfa1d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">92%</div>
             <div className="flex items-center text-xs text-green-500 mt-1">
               <TrendingUp className="h-3 w-3 mr-1" /> +2% from last month
             </div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Goal Completion</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">65%</div>
             <div className="flex items-center text-xs text-muted-foreground mt-1">
               On track for year end
             </div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Intervention Adherence</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">88%</div>
             <div className="flex items-center text-xs text-red-500 mt-1">
               <TrendingDown className="h-3 w-3 mr-1" /> -5% missed sessions
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
