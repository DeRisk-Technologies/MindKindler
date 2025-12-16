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
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Assessment } from "@/types/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssessmentsPage() {
  const { data: assessments, loading } = useFirestoreCollection<Assessment>("assessments", "date", "desc");
  const { data: students } = useFirestoreCollection<any>("students", "lastName", "asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = assessments.filter(
    (a) => a.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
        type: formData.get("type"),
        studentId: formData.get("studentId"),
        date: new Date().toISOString(), // Simplified date handling
        status: "draft",
        score: parseInt(formData.get("score") as string) || 0,
        updatedAt: serverTimestamp(),
    };
    
    try {
      if (editingId) {
         await updateDoc(doc(db, "assessments", editingId), data);
         toast({ title: "Updated", description: "Assessment updated." });
      } else {
         await addDoc(collection(db, "assessments"), { ...data, createdAt: serverTimestamp() });
         toast({ title: "Created", description: "New assessment started." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      await deleteDoc(doc(db, "assessments", id));
  };

  const getStudentName = (id: string) => {
      const s = students.find(st => st.id === id);
      return s ? `${s.firstName} ${s.lastName}` : id;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assessments</h1>
          <p className="text-muted-foreground">Track and manage student assessments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent>
             <DialogHeader>
              <DialogTitle>{editingId ? "Edit Assessment" : "New Assessment"}</DialogTitle>
              <DialogDescription>Record test details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Assessment Type</Label>
                <Input id="type" name="type" placeholder="e.g. WISC-V" required defaultValue={editingId ? assessments.find(a => a.id === editingId)?.type : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                 <Select name="studentId" required defaultValue={editingId ? assessments.find(a => a.id === editingId)?.studentId : ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input id="score" name="score" type="number" defaultValue={editingId ? assessments.find(a => a.id === editingId)?.score : "0"} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assessment Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
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
                  <TableHead>Type</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No assessments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.type}</TableCell>
                      <TableCell>{getStudentName(a.studentId)}</TableCell>
                      <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                      <TableCell>{a.score ?? '-'}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => { setEditingId(a.id); setIsDialogOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
