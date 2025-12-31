"use client";

import { useState } from "react";
import { Case, IEP } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Download, Share2, Target, CheckCircle2 } from "lucide-react";

interface CaseIEPProps {
  caseData: Case;
}

export function CaseIEP({ caseData }: CaseIEPProps) {
  // Mock IEP Data
  const [iep, setIep] = useState<IEP | null>({
    id: "iep_1",
    caseId: caseData.id,
    studentId: caseData.studentId || "std_1",
    startDate: "2023-09-01",
    endDate: "2024-06-30",
    status: "active",
    goals: [
      {
        id: "g1",
        type: "academic",
        description: "Improve reading fluency to 100 words per minute.",
        successCriteria: "3 consecutive assessments > 95 wpm",
        dueDate: "2023-12-31",
        responsibleParty: "Special Ed Teacher",
        status: "in-progress",
        progress: 65
      },
      {
        id: "g2",
        type: "behavioral",
        description: "Reduce classroom disruptions.",
        successCriteria: "< 2 incidents per week",
        dueDate: "2024-03-01",
        responsibleParty: "Class Teacher",
        status: "in-progress",
        progress: 40
      }
    ]
  });

  if (!iep) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">No Active IEP</h3>
        <p className="text-muted-foreground mb-6">Create a new Individualized Education Plan for this student.</p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create IEP
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Individualized Education Plan</h2>
          <p className="text-muted-foreground">
            Active Period: {new Date(iep.startDate).toLocaleDateString()} - {new Date(iep.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Goal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Goals List */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {iep.goals.map((goal) => (
                  <AccordionItem key={goal.id} value={goal.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {goal.status === 'achieved' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Target className="h-5 w-5 text-primary" />
                          )}
                          <div className="text-left">
                            <span className="font-medium">{goal.description}</span>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{goal.type}</Badge>
                              <span className="text-xs text-muted-foreground">Due: {goal.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 min-w-[150px]">
                          <Progress value={goal.progress} className="h-2 w-24" />
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/30 p-4 rounded-md mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold mb-1">Success Criteria</p>
                          <p className="text-muted-foreground">{goal.successCriteria}</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Responsible Party</p>
                          <p className="text-muted-foreground">{goal.responsibleParty}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button size="sm" variant="outline">Update Progress</Button>
                        <Button size="sm" variant="secondary">Edit Goal</Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-primary/20">
                <span className="text-3xl font-bold">52%</span>
                <div className="absolute top-0 left-0 h-full w-full rounded-full border-t-8 border-primary animate-spin-slow" style={{ animationDuration: '3s' }}></div>
              </div>
              <p className="mt-4 text-sm text-center text-muted-foreground">
                2 of 5 goals completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Interventions</CardTitle>
              <CardDescription>Based on current goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                <span className="text-sm font-medium">Peer Tutoring</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                <span className="text-sm font-medium">Self-Monitoring Checklist</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
