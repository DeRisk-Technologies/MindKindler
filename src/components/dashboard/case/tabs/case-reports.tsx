"use client";

import { useState } from "react";
import { Case, Report } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Download, Share2, Edit, Printer, Plus } from "lucide-react";
import { useRouter } from 'next/navigation';

interface CaseReportsProps {
  caseData: Case;
}

export function CaseReports({ caseData }: CaseReportsProps) {
  const router = useRouter();
  // Mock Reports - In production these would come from Firestore 'reports' collection
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
    }
  ]);

  const handleCreateReport = () => {
    // Redirect to the AI Report Builder (Forensic Workbench integration)
    // We pass caseId as query param so builder knows context
    router.push(`/dashboard/reports/builder?caseId=${caseData.id}&studentId=${caseData.studentId}`);
  };

  const handleEditReport = (reportId: string) => {
    router.push(`/dashboard/reports/editor/${reportId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statutory & Clinical Reports</h3>
        <Button 
            onClick={handleCreateReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
            <Sparkles className="mr-2 h-4 w-4" /> 
            Draft Report with AI
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium text-slate-800">
                  {report.title}
                </CardTitle>
                <CardDescription>
                  {new Date(report.createdAt).toLocaleDateString()} • {report.language.toUpperCase()}
                </CardDescription>
              </div>
              <Badge variant={report.status === 'final' ? 'default' : 'outline'} className={report.status === 'final' ? 'bg-green-600' : ''}>
                {report.status?.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => handleEditReport(report.id)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm">
                  <Printer className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State / Add New */}
        <div 
            onClick={handleCreateReport}
            className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 cursor-pointer transition-colors"
        >
            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <Plus className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-indigo-900">Create New Report</p>
            <p className="text-xs text-slate-500">Statutory Advice, Letter, or Full Assessment</p>
        </div>
      </div>
    </div>
  );
}
