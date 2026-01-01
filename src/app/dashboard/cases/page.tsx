"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Case } from "@/types/schema";
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
  CardDescription
} from "@/components/ui/card";
import { Plus, Search, Loader2, Pencil, Trash2, FolderOpen, School, User, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function CasesPage() {
  const router = useRouter();
  // Sort by createdAt now, consistent with new schema
  const { data: cases, loading: loadingCases } = useFirestoreCollection<Case>("cases", "createdAt", "desc");
  const { data: students } = useFirestoreCollection<any>("students", "lastName", "asc");
  const { data: schools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: users } = useFirestoreCollection<any>("users", "displayName", "asc"); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [caseType, setCaseType] = useState<string>("student");
  
  const { toast } = useToast();

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.status && c.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLinkedEntityName = (c: any) => {
      // Use subjectId from new schema if available, else fallback for legacy
      const entityId = c.subjectId || c.studentId || c.schoolId;
      
      if (c.type === 'student' || c.studentId) {
          const s = students.find(st => st.id === entityId);
          return s ? `${s.firstName} ${s.lastName}` : "Unknown Student";
      } else if (c.type === 'school' || c.schoolId) {
          const s = schools.find(sc => sc.id === entityId);
          return s ? s.name : "Unknown School";
      } else if (c.type === 'staff') {
          const p = users.find(u => u.id === entityId || u.uid === entityId);
          return p ? p.displayName : "Unknown Staff";
      }
      return "General Case";
  };

  const handleSaveCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Determine linking based on type
    const type = formData.get("type") as string;
    let subjectId = null;
    
    if (type === 'student') subjectId = formData.get("studentId");
    else if (type === 'school') subjectId = formData.get("schoolId");
    else if (type === 'staff') subjectId = formData.get("staffId");

    const data = {
        title: formData.get("title"),
        type: type,
        subjectId: subjectId,
        status: formData.get("status"),
        priority: formData.get("priority"),
        description: formData.get("description"),
        // Use createdAt for new schema consistency
        ...(editingId ? {} : { createdAt: new Date().toISOString() }),
        updatedAt: new Date().toISOString(), 
    };
    
    try {
      if (editingId) {
        await updateDoc(doc(db, "cases", editingId), data);
        toast({ title: "Updated", description: "Case details updated." });
      } else {
        await addDoc(collection(db, "cases"), { 
            ...data, 
            evidence: [], 
            // createdAt is already in data object
        });
        toast({ title: "Created", description: "New case file opened." });
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
    if(!confirm("Delete this case? This cannot be undone.")) return;
    await deleteDoc(doc(db, "cases", id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Case Management</h1>
        <p className="text-muted-foreground">Central hub for tracking interventions, consultations, and support.</p>
      </div>

      <div className="flex justify-between items-center">
         <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Open New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
               <DialogHeader>
                <DialogTitle>{editingId ? "Edit Case File" : "Open New Case File"}</DialogTitle>
                <DialogDescription>Create a tracking container for assessments and support.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveCase} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Case Title / Subject</Label>
                  <Input id="title" name="title" placeholder="e.g. Learning Support Plan 2024" required defaultValue={editingId ? cases.find(c => c.id === editingId)?.title : ""} />
                </div>
                
                <div className="space-y-2">
                    <Label>Case Type</Label>
                    <Select name="type" onValueChange={setCaseType} defaultValue={editingId ? cases.find(c => c.id === editingId)?.type : "student"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="student">Student Intervention</SelectItem>
                            <SelectItem value="school">School Support</SelectItem>
                            <SelectItem value="staff">Staff Consultation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Dynamic Selection based on Type */}
                {caseType === 'student' && (
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Select Student</Label>
                        <Select name="studentId" defaultValue={editingId ? (cases.find(c => c.id === editingId)?.subjectId || (cases.find(c => c.id === editingId) as any)?.studentId) : ""}>
                            <SelectTrigger><SelectValue placeholder="Search Student..." /></SelectTrigger>
                            <SelectContent>
                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {caseType === 'school' && (
                    <div className="space-y-2">
                        <Label htmlFor="schoolId">Select School</Label>
                        <Select name="schoolId" defaultValue={editingId ? (cases.find(c => c.id === editingId)?.subjectId || (cases.find(c => c.id === editingId) as any)?.schoolId) : ""}>
                            <SelectTrigger><SelectValue placeholder="Search School..." /></SelectTrigger>
                            <SelectContent>
                                {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {caseType === 'staff' && (
                    <div className="space-y-2">
                        <Label htmlFor="staffId">Select Staff/Parent</Label>
                        <Select name="staffId" defaultValue={editingId ? cases.find(c => c.id === editingId)?.subjectId : ""}>
                            <SelectTrigger><SelectValue placeholder="Search User..." /></SelectTrigger>
                            <SelectContent>
                                {users.map(p => <SelectItem key={p.id} value={p.id || p.uid}>{p.displayName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" defaultValue={editingId ? cases.find(c => c.id === editingId)?.priority : "Medium"}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Critical">Critical</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={editingId ? cases.find(c => c.id === editingId)?.status : "active"}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="triage">Triage</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Initial Notes / Description</Label>
                    <Textarea id="description" name="description" placeholder="Brief context..." defaultValue={editingId ? cases.find(c => c.id === editingId)?.description : ""} />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {editingId ? "Update Case" : "Open Case"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
            <TabsTrigger value="all">All Active Cases</TabsTrigger>
            <TabsTrigger value="student">Student Cases</TabsTrigger>
            <TabsTrigger value="school">School Cases</TabsTrigger>
            <TabsTrigger value="staff">Staff/Consultations</TabsTrigger>
        </TabsList>

        {['all', 'student', 'school', 'staff'].map(tab => (
            <TabsContent key={tab} value={tab}>
                <Card>
                    <CardHeader>
                        <CardTitle className="capitalize">{tab === 'all' ? 'Active Case Load' : `${tab} Cases`}</CardTitle>
                        <CardDescription>
                            {tab === 'all' ? 'Overview of all your open files.' : `Filtered view for ${tab} interventions.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingCases ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Case Title</TableHead>
                                        <TableHead>Linked Entity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCases
                                        .filter(c => tab === 'all' ? true : c.type === tab)
                                        .map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/cases/${c.id}`)}>
                                                <div className="flex items-center gap-2 hover:underline">
                                                    <FolderOpen className="h-4 w-4 text-blue-500" />
                                                    {c.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {c.type === 'student' && <User className="h-3 w-3 text-muted-foreground" />}
                                                    {c.type === 'school' && <School className="h-3 w-3 text-muted-foreground" />}
                                                    {c.type === 'staff' && <MessageCircle className="h-3 w-3 text-muted-foreground" />}
                                                    {getLinkedEntityName(c)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={c.status === "resolved" ? "secondary" : "default"}>
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    c.priority === 'Critical' ? 'text-red-600 border-red-200 bg-red-50 font-bold' : 
                                                    c.priority === 'High' ? 'text-red-500 border-red-200 bg-red-50' : 
                                                    c.priority === 'Medium' ? 'text-orange-500 border-orange-200 bg-orange-50' : ''
                                                }>
                                                    {c.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/cases/${c.id}`)} title="Open Details">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(c.id); setCaseType(c.type); setIsDialogOpen(true); }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredCases.filter(c => tab === 'all' ? true : c.type === tab).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No cases found in this view.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
