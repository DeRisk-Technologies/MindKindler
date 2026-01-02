"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { AssessmentTemplate, AssessmentAssignment } from "@/types/schema";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, BrainCircuit, Users, BarChart3, Edit, PlayCircle, ClipboardList, Mic } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection, getDocs, query, limit, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AssessmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: templates, loading: templatesLoading } = useFirestoreCollection<AssessmentTemplate>("assessment_templates", "createdAt", "desc");
  const { data: assignments, loading: assignmentsLoading } = useFirestoreCollection<AssessmentAssignment>("assessment_assignments", "assignedAt", "desc");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [targetStudent, setTargetStudent] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);

  // Simple student search for assignment dialog
  const searchStudents = async (term: string) => {
      if (!term) return;
      const q = query(collection(db, "students"), limit(5)); // In real app, filter by name
      const snap = await getDocs(q);
      setStudentResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const createAssignment = async (status: 'pending' | 'in_progress' = 'pending', mode: 'student-async' | 'clinician-live' = 'student-async') => {
      if (!selectedTemplate || !targetStudent) return null;

      const assignmentData = {
        templateId: selectedTemplate.id,
        targetId: targetStudent,
        targetType: 'student',
        assignedBy: auth.currentUser?.uid || 'system',
        assignedAt: new Date().toISOString(),
        status: status,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        mode: mode
      };

      const docRef = await addDoc(collection(db, "assessment_assignments"), assignmentData);
      return docRef.id;
  };

  const handleAssign = async () => {
      setIsAssigning(true);
      try {
          await createAssignment('pending', 'student-async');
          toast({ title: "Assigned", description: `Assessment assigned to student.` });
          setSelectedTemplate(null);
      } catch (e) {
          toast({ title: "Error", description: "Failed to assign.", variant: "destructive" });
      } finally {
          setIsAssigning(false);
      }
  };

  const handleStartNow = async (mode: 'student-async' | 'clinician-live') => {
      setIsAssigning(true);
      try {
          // Create an assignment specifically for this run
          const assignmentId = await createAssignment('in_progress', mode);
          if (assignmentId) {
             // Navigate to the runner with the ASSIGNMENT ID, not template ID
             router.push(`/portal/assessment/${assignmentId}`);
          }
      } catch (e) {
           toast({ title: "Error", description: "Failed to start assessment.", variant: "destructive" });
      } finally {
           setIsAssigning(false);
      }
  }

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assessments</h1>
          <p className="text-muted-foreground">
            Manage templates and track active student evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.push('/dashboard/assessments/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Global Analytics
           </Button>
           <Button onClick={() => router.push('/dashboard/assessments/builder')}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
           </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="active">Active Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
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
                  <CardDescription>Design and manage assessment forms.</CardDescription>
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
                            <Badge variant="outline">{template.category || 'General'}</Badge>
                          </TableCell>
                          <TableCell>{template.questions?.length || 0}</TableCell>
                          <TableCell>
                             <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                                {template.status}
                             </Badge>
                          </TableCell>
                          <TableCell>{template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "-"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/assessments/builder?id=${template.id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Conduct Assessment" onClick={() => { setSelectedTemplate(template); searchStudents("all"); }}>
                                      <PlayCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Conduct Assessment</DialogTitle>
                                        <DialogDescription>Run '{template.title}' for a student.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Select Student</Label>
                                            <Select onValueChange={setTargetStudent}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Search student..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {studentResults.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
                                        <Button onClick={() => handleStartNow('student-async')} disabled={isAssigning || !targetStudent}>
                                            Start Now (Self)
                                        </Button>
                                        <Button 
                                            onClick={() => handleStartNow('clinician-live')} 
                                            disabled={isAssigning || !targetStudent}
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Mic className="h-4 w-4 mr-2" />
                                            Start Live Session
                                        </Button>
                                        <Button variant="outline" onClick={handleAssign} disabled={isAssigning || !targetStudent}>
                                            Assign for Later
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="active">
              <Card>
                  <CardHeader>
                      <CardTitle>Active Assessments</CardTitle>
                      <CardDescription>Ongoing evaluations for students.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Template</TableHead>
                                  <TableHead>Student ID</TableHead>
                                  <TableHead>Assigned</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {assignments.map(assignment => (
                                  <TableRow key={assignment.id}>
                                      <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                              <ClipboardList className="h-4 w-4 text-orange-500" />
                                              {/* In real app, fetch template title or store denormalized */}
                                              Template {assignment.templateId.substring(0, 6)}...
                                          </div>
                                          {assignment.mode === 'clinician-live' && <Badge variant="secondary" className="text-[10px] mt-1">Live Mode</Badge>}
                                      </TableCell>
                                      <TableCell>{assignment.targetId}</TableCell>
                                      <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                                      <TableCell>
                                          <Badge variant="outline" className="capitalize">{assignment.status}</Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button size="sm" variant="ghost" onClick={() => router.push(`/portal/assessment/${assignment.id}`)}>
                                              <PlayCircle className="h-4 w-4 mr-2" /> Continue
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                              {!assignmentsLoading && assignments.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active assessments.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
