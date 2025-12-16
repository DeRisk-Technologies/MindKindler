"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookUser,
  ClipboardList,
  FileText,
  FolderKanban,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const chartData = [
  { month: "Jan", assessments: 18 },
  { month: "Feb", assessments: 22 },
  { month: "Mar", assessments: 25 },
  { month: "Apr", assessments: 19 },
  { month: "May", assessments: 31 },
  { month: "Jun", assessments: 28 },
];

const recentCases = [
  {
    id: "CASE-001",
    student: "Leo Martinez",
    status: "Open",
    date: "2023-06-23",
  },
  {
    id: "CASE-002",
    student: "Sophia Chen",
    status: "In Review",
    date: "2023-06-21",
  },
  {
    id: "CASE-003",
    student: "Amelia Williams",
    status: "Closed",
    date: "2023-06-18",
  },
  {
    id: "CASE-004",
    student: "Noah Johnson",
    status: "Open",
    date: "2023-06-15",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Welcome, Dr. Reed
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg">
            <Link href="/dashboard/cases">
              <FolderKanban className="mr-2 h-5 w-5" /> New Case
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
            <Link href="/dashboard/assessments">
              <ClipboardList className="mr-2 h-5 w-5" /> New Assessment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FolderKanban className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Students Watched
            </CardTitle>
            <BookUser className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">34</div>
            <p className="text-xs text-muted-foreground">
              Across 3 schools
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Generated
            </CardTitle>
            <FileText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">5</div>
            <p className="text-xs text-muted-foreground">Active in your team</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Recent Cases
            </CardTitle>
            <CardDescription>
              An overview of your most recent case files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">{caseItem.id}</TableCell>
                    <TableCell>{caseItem.student}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          caseItem.status === "Open"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                            : caseItem.status === "Closed"
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"
                        }
                        variant="outline"
                      >
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseItem.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Assessments Overview
            </CardTitle>
            <CardDescription>
              Number of assessments conducted per month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={chartData}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="assessments"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
