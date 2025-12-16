"use client";

import { Case } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Users, Activity, AlertTriangle, FileText, CheckCircle } from "lucide-react";

interface CaseOverviewProps {
  caseData: Case;
}

export function CaseOverview({ caseData }: CaseOverviewProps) {
  // Mock data for student - in real app, fetch this based on caseData.studentId
  const student = {
    name: "John Doe",
    age: 10,
    grade: "5th Grade",
    school: "Springfield Elementary",
    image: "/avatars/01.png",
    concerns: ["Reading Difficulty", "Attention Span"]
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <div className="col-span-4 space-y-4">
        {/* Student/Subject Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.image} alt={student.name} />
              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{student.name}</CardTitle>
              <CardDescription>{student.age} years old • {student.grade}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {student.concerns.map((concern) => (
                  <Badge key={concern} variant="secondary">{concern}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">School:</span>
                <span className="font-medium">{student.school}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Opened:</span>
                <span className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {caseData.description || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions on this case.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.activities?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-2 w-2 rounded-full bg-primary" />
                    {index !== (caseData.activities.length - 1) && (
                      <div className="h-full w-[1px] bg-border my-1" />
                    )}
                  </div>
                  <div className="space-y-1 pb-4">
                    <p className="text-sm font-medium leading-none">{activity.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()} • {activity.performedBy}
                    </p>
                  </div>
                </div>
              ))}
              {!caseData.activities?.length && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-3 space-y-4">
        {/* Key Metrics / Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 high priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tomorrow</div>
              <p className="text-xs text-muted-foreground">10:00 AM</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Team */}
        <Card>
          <CardHeader>
            <CardTitle>Care Team</CardTitle>
            <CardDescription>Professionals assigned to this case.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>EP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Dr. Sarah Smith</p>
                  <p className="text-xs text-muted-foreground">Educational Psychologist</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>TC</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Mr. Johnson</p>
                  <p className="text-xs text-muted-foreground">Class Teacher</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              Manage Team
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="w-full justify-start" variant="ghost">
              <FileText className="mr-2 h-4 w-4" /> Add Note
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <Activity className="mr-2 h-4 w-4" /> Log Intervention
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <AlertTriangle className="mr-2 h-4 w-4" /> Report Incident
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
