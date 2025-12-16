import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  BookUser,
  ClipboardList,
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
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Dr. Reed
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/cases">
              <FolderKanban className="mr-2 h-4 w-4" /> New Case
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard/assessments">
              <ClipboardList className="mr-2 h-4 w-4" /> New Assessment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Students Watched
            </CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">
              Across 3 schools
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Generated
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Active in your team</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
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
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.id}</TableCell>
                    <TableCell>{caseItem.student}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          caseItem.status === "Open"
                            ? "default"
                            : caseItem.status === "Closed"
                            ? "secondary"
                            : "outline"
                        }
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

        <Card>
          <CardHeader>
            <CardTitle>Assessments Overview</CardTitle>
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
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Bar
                  dataKey="assessments"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
