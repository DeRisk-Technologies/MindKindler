import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuestionnaireForm } from "@/components/dashboard/questionnaire-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssessmentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Implement digital questionnaires and auto-score results.
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">New Assessment</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-6">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>ADHD Screening Questionnaire</CardTitle>
              <CardDescription>
                Based on the ASRS-v1.1. Please answer the questions below about
                how you have felt and behaved during the past 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionnaireForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>
                A record of all completed assessments will be displayed here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>No historical data available yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Library</CardTitle>
              <CardDescription>
                A library of common screening tools (e.g., dyslexia risk scale)
                will be available here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Library is currently empty.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
