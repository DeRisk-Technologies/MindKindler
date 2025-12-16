"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportGenerator } from "@/components/dashboard/report-generator";
import { DiagnosisAssistant } from "@/components/dashboard/diagnosis-assistant";
import { Translator } from "@/components/dashboard/translator";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Clinical Tools
        </h1>
        <p className="text-muted-foreground">
          AI-assisted tools for report generation, diagnosis, and translation.
        </p>
      </div>
      
      <Tabs defaultValue="report" className="space-y-4">
        <TabsList>
          <TabsTrigger value="report">Report Generator</TabsTrigger>
          <TabsTrigger value="diagnosis">Differential Diagnosis</TabsTrigger>
          <TabsTrigger value="translation">Translation</TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="space-y-4">
          <ReportGenerator />
        </TabsContent>
        <TabsContent value="diagnosis" className="space-y-4">
          <DiagnosisAssistant />
        </TabsContent>
        <TabsContent value="translation" className="space-y-4">
          <Translator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
