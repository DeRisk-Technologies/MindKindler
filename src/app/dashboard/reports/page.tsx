import { ReportGenerator } from "@/components/dashboard/report-generator";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          AI-Assisted Report Generation
        </h1>
        <p className="text-muted-foreground">
          Generate draft reports summarizing a child’s strengths, challenges,
          and recommended interventions.
        </p>
      </div>
      <ReportGenerator />
    </div>
  );
}
