"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";
import { FileText, Video, PlayCircle, Plus, BrainCircuit, ExternalLink } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/use-firestore";
import { ConsultationSession, Student } from "@/types/schema";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function ConsultationsPage() {
  const router = useRouter();
  const { data: sessions, loading } = useFirestoreCollection<ConsultationSession>("consultation_sessions", "date", "desc");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
      async function fetchStudents() {
          const q = query(collection(db, "students"), limit(20));
          const snap = await getDocs(q);
          setStudents(snap.docs.map(d => ({id: d.id, ...d.data()} as Student)));
      }
      fetchStudents();
  }, []);

  const handleStartSession = async () => {
      if (!selectedStudent) return;
      
      const newSession = await addDoc(collection(db, "consultation_sessions"), {
          studentId: selectedStudent,
          date: new Date().toISOString(),
          status: 'in_progress',
          notes: "",
          tenantId: "global", // Should be dynamic
          userId: auth.currentUser?.uid
      });
      
      setIsDialogOpen(false);
      router.push(`/dashboard/consultations/${newSession.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
          <p className="text-muted-foreground">
            Manage live sessions and generated clinical reports.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Start New Session
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start Consultation</DialogTitle>
                    <DialogDescription>Select a student to begin a live session with AI Co-Pilot.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label>Student</Label>
                    <Select onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select student..." />
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
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'in_progress').length}</div>
            <p className="text-xs text-muted-foreground">Live consultations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.reportId).length}</div>
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
                    <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                        {session.status === 'in_progress' ? 'In Progress' : 'Completed'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      {session.reportId ? (
                          <Link href={`/dashboard/reports/editor/${session.reportId}`} className="flex items-center text-blue-600 hover:underline text-sm">
                              <FileText className="mr-1 h-3 w-3" /> View Report
                          </Link>
                      ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                      )}
                  </TableCell>
                  <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/consultations/${session.id}`}>
                              {session.status === 'in_progress' ? <PlayCircle className="h-4 w-4 text-green-600" /> : <ExternalLink className="h-4 w-4" />}
                          </Link>
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
