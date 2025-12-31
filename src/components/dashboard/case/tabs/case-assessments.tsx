"use client";

import { useState } from "react";
import { Case, Assessment } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, BrainCircuit, Mic } from "lucide-react";

interface CaseAssessmentsProps {
  caseData: Case;
}

export function CaseAssessments({ caseData }: CaseAssessmentsProps) {
  // Mock assessments data
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: "1",
      caseId: caseData.id,
      studentId: caseData.studentId || "std_1",
      date: "2023-10-15",
      type: "ADHD Screening (Vanderbilt)",
      status: "completed",
      score: 18,
      outcome: "High Risk",
      notes: "Teacher report indicates significant attention issues."
    },
    {
      id: "2",
      caseId: caseData.id,
      studentId: caseData.studentId || "std_1",
      date: "2023-10-20",
      type: "Dyslexia Screening",
      status: "draft",
      notes: "Pending completion of reading task."
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assessments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Start Assessment</DialogTitle>
              <DialogDescription>
                Choose an assessment template to begin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhd">ADHD Screening</SelectItem>
                    <SelectItem value="dyslexia">Dyslexia Screening</SelectItem>
                    <SelectItem value="autism">Autism Spectrum (M-CHAT)</SelectItem>
                    <SelectItem value="emotional">Emotional Behavioral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Start</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>
            List of all assessments conducted for this case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score / Outcome</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>{new Date(assessment.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{assessment.type}</TableCell>
                  <TableCell>
                    <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                      {assessment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assessment.status === 'completed' ? (
                      <div className="flex flex-col">
                        <span>Score: {assessment.score}</span>
                        {assessment.outcome && (
                          <span className={assessment.outcome.includes('High') ? 'text-red-500 font-bold text-xs' : 'text-muted-foreground text-xs'}>
                            {assessment.outcome}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View Details">
                      <FileText className="h-4 w-4" />
                    </Button>
                    {assessment.status === 'completed' && (
                      <Button variant="ghost" size="icon" title="AI Analysis">
                        <BrainCircuit className="h-4 w-4 text-purple-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Digital Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Send digital forms to parents or teachers.</p>
            <Button variant="outline" size="sm" className="w-full">Send Form Link</Button>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice to Text</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Record observations or assessment responses.</p>
            <Button variant="outline" size="sm" className="w-full">Start Recording</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
