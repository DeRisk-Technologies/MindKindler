"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { Report } from "@/types/schema";
import { ReportGenerator } from "@/components/dashboard/report-generator";
import { DiagnosisAssistant } from "@/components/dashboard/diagnosis-assistant";
import { Translator } from "@/components/dashboard/translator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ReportsPage() {
  const { data: reports, loading } = useFirestoreCollection<Report>("reports", "createdAt", "desc");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter(r => 
      r.id.includes(searchTerm) || (r.language && r.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Clinical Tools & Reports
        </h1>
        <p className="text-muted-foreground">
          AI-assisted tools for report generation, diagnosis, and translation.
        </p>
      </div>
      
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis AI</TabsTrigger>
          <TabsTrigger value="translation">Translator</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
           <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                <CardTitle>Generated Reports</CardTitle>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reports..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title/ID</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No reports found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.id.substring(0,8)}...</TableCell>
                          <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="uppercase">{r.language || 'EN'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
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
