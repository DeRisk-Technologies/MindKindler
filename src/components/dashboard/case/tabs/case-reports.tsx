"use client";

import { useState } from "react";
import { Case, Report } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Download, Share2, Edit, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CaseReportsProps {
  caseData: Case;
}

export function CaseReports({ caseData }: CaseReportsProps) {
  // Mock Reports
  const [reports, setReports] = useState<Report[]>([
    {
      id: "rep_1",
      caseId: caseData.id,
      studentId: caseData.studentId || "std_1",
      title: "Psychological Assessment Report",
      sections: [
        { title: "Summary", content: "Comprehensive psychological assessment report..." }
      ],
      generatedContent: "...",
      finalContent: "Comprehensive psychological assessment report...",
      language: "en",
      createdAt: "2023-11-01",
      status: "final",
      version: 1
    },
    {
      id: "rep_2",
      caseId: caseData.id,
      studentId: caseData.studentId || "std_1",
      title: "Progress Update",
      sections: [
        { title: "Progress", content: "Draft progress update..." }
      ],
      generatedContent: "...",
      finalContent: "Draft progress update...",
      language: "en",
      createdAt: "2023-10-15",
      status: "draft",
      version: 1
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Case Reports</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <Sparkles className="mr-2 h-4 w-4" /> Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Report Generation</DialogTitle>
              <DialogDescription>
                Select the type of report you want the AI to draft based on current case data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Full Assessment</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Progress Update</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Referral Letter</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>IEP Summary</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">
                  {report.title}
                </CardTitle>
                <CardDescription>
                  {new Date(report.createdAt).toLocaleDateString()} • {report.language.toUpperCase()}
                </CardDescription>
              </div>
              <Badge variant={report.status === 'final' ? 'default' : 'outline'}>
                {report.status?.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {report.sections?.[0]?.content || report.finalContent}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* History Summarisation Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Case History Summary (AI Generated)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            John (10y) presented with reading difficulties and attention concerns. Initial ADHD screening (Vanderbilt) on Oct 15, 2023, indicated high risk (Score: 18). Teacher observations confirm distractibility. An IEP was established on Sep 1, 2023, targeting reading fluency and behavioral regulation. Speech therapy and reading support are ongoing. Recent trends show a 15% improvement in reading fluency, though classroom disruptions remain a challenge.
          </p>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">Regenerate Summary</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
