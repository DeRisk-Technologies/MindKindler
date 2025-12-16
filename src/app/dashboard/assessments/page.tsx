"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { AssessmentTemplate } from "@/types/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, BrainCircuit, Users, BarChart3, Edit, PlayCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssessmentsPage() {
  const router = useRouter();
  const { data: templates, loading } = useFirestoreCollection<AssessmentTemplate>("assessment_templates", "createdAt", "desc");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assessments</h1>
          <p className="text-muted-foreground">
            Create, manage, and analyze student assessments.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.push('/dashboard/assessments/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Global Analytics
           </Button>
           <Button onClick={() => router.push('/dashboard/assessments/builder')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assessment
           </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-background border-indigo-200 dark:border-indigo-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generator</CardTitle>
            <BrainCircuit className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Quick Create</div>
            <p className="text-xs text-muted-foreground mb-4">
              Generate questions from a topic description using AI.
            </p>
            <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push('/dashboard/assessments/builder?mode=ai')}>
              Start Generator
            </Button>
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 pending grading</p>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Library Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Templates available</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search templates..." 
             className="pl-8"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
          <CardDescription>Manage your assessment forms and questionnaires.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                       <FileText className="h-4 w-4 text-blue-500" />
                       {template.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category}</Badge>
                  </TableCell>
                  <TableCell>{template.questions.length}</TableCell>
                  <TableCell>
                     <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                        {template.status}
                     </Badge>
                  </TableCell>
                  <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/assessments/builder/${template.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Preview/Assign">
                      <PlayCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredTemplates.length === 0 && (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No templates found. Create one to get started.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
