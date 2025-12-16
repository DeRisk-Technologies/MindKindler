"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { ConsultationSession, Student } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Video, FileText, BrainCircuit, Mic } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ConsultationsPage() {
  const router = useRouter();
  const { data: sessions, loading } = useFirestoreCollection<ConsultationSession>("consultation_sessions", "date", "desc");
  const { data: students } = useFirestoreCollection<Student>("students", "lastName", "asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const handleStartSession = async () => {
    if (!selectedStudent) return;
    
    try {
        const docRef = await addDoc(collection(db, "consultation_sessions"), {
            caseId: "pending_link", // In real app, link to active case
            studentId: selectedStudent,
            eppId: "current_user_uid",
            date: new Date().toISOString(),
            status: "in-progress",
            notes: "",
            aiInsights: []
        });
        
        router.push(`/dashboard/consultations/${docRef.id}`);
    } catch (e) {
        console.error("Error starting session:", e);
    }
  };

  return (
    <div className="space-y-8 p-8 pt-6">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">AI Co-Pilot Consultations</h1>
             <p className="text-muted-foreground">Real-time session assistance and automated reporting.</p>
          </div>
          <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <Plus className="mr-2 h-4 w-4" /> Start New Session
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Begin Consultation</DialogTitle>
                      <DialogDescription>Select a student to initialize the AI Co-Pilot.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                      <Label>Select Student</Label>
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                              <SelectValue placeholder="Search student..." />
                          </SelectTrigger>
                          <SelectContent>
                              {students.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleStartSession} disabled={!selectedStudent}>
                          Launch Co-Pilot
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
       </div>

       <div className="grid gap-4 md:grid-cols-3">
           <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background border-purple-200">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                   <Video className="h-4 w-4 text-purple-600" />
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'in-progress').length}</div>
                   <p className="text-xs text-muted-foreground">Live consultations</p>
               </CardContent>
           </Card>
           
           <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                   <FileText className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">24</div>
                   <p className="text-xs text-muted-foreground">This month</p>
               </CardContent>
           </Card>

           <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                   <BrainCircuit className="h-4 w-4 text-indigo-500" />
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">156</div>
                   <p className="text-xs text-muted-foreground">Suggestions provided</p>
               </CardContent>
           </Card>
       </div>

       <Card>
           <CardHeader>
               <CardTitle>Session History</CardTitle>
               <CardDescription>Past consultations and generated reports.</CardDescription>
           </CardHeader>
           <CardContent>
               <Table>
                   <TableHeader>
                       <TableRow>
                           <TableHead>Date</TableHead>
                           <TableHead>Student</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Report</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                   </TableHeader>
                   <TableBody>
                       {sessions.map(session => (
                           <TableRow key={session.id}>
                               <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                               <TableCell>
                                   {students.find(s => s.id === session.studentId)?.firstName || "Unknown"}
                               </TableCell>
                               <TableCell>
                                   <Badge variant={session.status === 'in-progress' ? 'default' : 'secondary'}>
                                       {session.status}
                                   </Badge>
                               </TableCell>
                               <TableCell>
                                   {session.reportId ? (
                                       <Badge variant="outline" className="border-green-500 text-green-500">
                                           <CheckCircle className="mr-1 h-3 w-3" /> Ready
                                       </Badge>
                                   ) : (
                                       <span className="text-xs text-muted-foreground">Pending</span>
                                   )}
                               </TableCell>
                               <TableCell className="text-right">
                                   <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/consultations/${session.id}`)}>
                                       {session.status === 'in-progress' ? 'Resume' : 'View'}
                                   </Button>
                               </TableCell>
                           </TableRow>
                       ))}
                   </TableBody>
               </Table>
           </CardContent>
       </Card>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    )
}
