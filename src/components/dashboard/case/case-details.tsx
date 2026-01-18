// src/components/dashboard/case/case-details.tsx
"use client";

import { useEffect, useState } from "react";
// Removed unused imports causing errors
import { Case } from "@/types/schema";
import { useFirestore } from "@/hooks/use-firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { CaseOverview } from "./tabs/case-overview";
import { CaseAssessments } from "@/components/dashboard/case/tabs/case-assessments";
import { CaseObservations } from "@/components/dashboard/case/tabs/case-observations";
import { CaseIEP } from "@/components/dashboard/case/tabs/case-iep";
import { CaseInterventions } from "@/components/dashboard/case/tabs/case-interventions";
import { CaseReports } from "@/components/dashboard/case/tabs/case-reports";
import { CaseMessages } from "@/components/dashboard/case/tabs/case-messages";
import { CaseAnalytics } from "@/components/dashboard/case/tabs/case-analytics";
import { CaseFiles } from "@/components/dashboard/case/tabs/case-files";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CopilotFloat } from "@/components/dashboard/case/ai-copilot-float"; 
import { RiskAlertButton } from "@/components/dashboard/widgets/RiskAlertButton"; 
import { CreateAppointmentDialog } from '@/components/dashboard/appointments/create-dialog';

interface CaseDetailsProps {
  caseId: string;
}

export function CaseDetails({ caseId }: CaseDetailsProps) {
  const router = useRouter();
  const { getDocument } = useFirestore();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);

  // Real-time listener for the case document
  useEffect(() => {
    if (!caseId) return;

    const unsubscribe = onSnapshot(
      doc(db, "cases", caseId),
      (doc) => {
        if (doc.exists()) {
          setCaseData({ id: doc.id, ...doc.data() } as Case);
          setLoading(false);
        } else {
          setError("Case not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching case:", err);
        setError("Failed to load case data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [caseId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Case not found"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{caseData.title}</h1>
              <Badge variant={caseData.status === 'active' ? 'default' : 'secondary'}>
                {caseData.status}
              </Badge>
              <Badge variant="outline" className={
                caseData.priority === 'High' ? 'border-red-500 text-red-500' : 
                caseData.priority === 'Medium' ? 'border-yellow-500 text-yellow-500' : 
                'border-green-500 text-green-500'
              }>
                {caseData.priority} Priority
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Case ID: {caseData.id} • Last Updated: {new Date(caseData.updatedAt || caseData.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RiskAlertButton 
                caseId={caseId} 
                studentId={caseData.studentId} 
                studentName={caseData.studentName} // Assuming flattening
            />
            <Button variant="outline" onClick={() => router.push('/dashboard/cases')}>
              Back to List
            </Button>
            
            {/* Direct Integration of Appointment Dialog */}
            <CreateAppointmentDialog />
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="observations">Observations</TabsTrigger>
              <TabsTrigger value="iep">IEP & Goals</TabsTrigger>
              <TabsTrigger value="interventions">Interventions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <CaseOverview caseData={caseData} />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <CaseAssessments caseData={caseData} />
          </TabsContent>

          <TabsContent value="observations" className="space-y-4">
            <CaseObservations caseData={caseData} />
          </TabsContent>

          <TabsContent value="iep" className="space-y-4">
            <CaseIEP caseData={caseData} />
          </TabsContent>

          <TabsContent value="interventions" className="space-y-4">
            <CaseInterventions caseData={caseData} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <CaseReports caseData={caseData} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <CaseMessages caseData={caseData} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <CaseAnalytics caseData={caseData} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <CaseFiles caseData={caseData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Copilot Float */}
      {/* Updated to use the correct exported component name */}
      <CopilotFloat contextMode="case" contextId={caseId} />
    </div>
  );
}
