"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Student } from "@/types/schema";
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
} from "@/components/ui/card";
import { Plus, Search, Loader2, User, AlertTriangle, Pencil, Trash2, Users, ExternalLink, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { db, getRegionalDb } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions"; 
import { StudentEditDialog } from "@/components/student360/dialogs/StudentEditDialog"; // NEW IMPORT

export default function StudentsPage() {
  const { shardId } = usePermissions();
  
  const { data: students, loading: loadingStudents, refresh: refreshStudents } = useFirestoreCollection<Student>("students", "lastName", "asc");
  const { data: schools, loading: loadingSchools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users", "displayName", "asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStudentEditOpen, setIsStudentEditOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  
  // Parent state
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);

  const { toast } = useToast();

  const parents = users.filter(u => u.role === 'parent');

  const filteredStudents = students.filter(
    (student) =>
      (student.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const filteredParents = parents.filter(
    (p) => 
      (p.displayName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (p.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleDeleteStudent = async (id: string) => {
    if(!confirm("Are you sure you want to delete this student?")) return;
    
    const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
    await deleteDoc(doc(targetDb, "students", id));
    
    refreshStudents();
    toast({ title: "Deleted", description: "Student record removed." });
  };

  const getSchoolName = (id?: string) => {
      if (!id) return "Unknown School";
      const s = schools.find(s => s.id === id);
      return s ? s.name : "Unknown School";
  };

  const getParentName = (id?: string) => {
      if (!id) return "No Parent Linked";
      const p = users.find(u => u.id === id || u.uid === id); 
      return p ? p.displayName : "Unknown Parent";
  };

  // --- PARENT LOGIC ---
  const handleSaveParent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const linkedStudentId = formData.get("linkedStudentId");

    const data = {
        displayName: formData.get("name"),
        email: formData.get("email"),
        role: "parent",
        phone: formData.get("phone"),
        address: formData.get("address"),
        linkedStudentIds: linkedStudentId && linkedStudentId !== "none" ? [linkedStudentId] : [],
        updatedAt: serverTimestamp(),
    };

    try {
        let parentRef;
        const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;

        if (editingParentId) {
            parentRef = doc(targetDb, "users", editingParentId);
            await updateDoc(parentRef, data);
            toast({ title: "Updated", description: "Parent profile updated." });
        } else {
             const newDoc = await addDoc(collection(targetDb, "users"), { 
                 ...data, 
                 uid: "gen_parent_" + Math.random().toString(36),
                 createdAt: serverTimestamp() 
             });
             parentRef = newDoc;
             toast({ title: "Created", description: "Parent profile added." });
        }

        if (linkedStudentId && linkedStudentId !== "none") {
             const studentRef = doc(targetDb, "students", linkedStudentId as string);
             await updateDoc(studentRef, { parentId: editingParentId || parentRef?.id });
        }

        setIsParentDialogOpen(false);
        setEditingParentId(null);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteParent = async (id: string) => {
      if(!confirm("Delete this parent profile?")) return;
      const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
      await deleteDoc(doc(targetDb, "users", id));
  };

  const handleEditStudent = (id: string) => {
      setEditingStudentId(id);
      setIsStudentEditOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Students & Parents</h1>
        <p className="text-muted-foreground">Manage student records and parent/guardian profiles.</p>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
            <TabsTrigger value="students">Student Directory</TabsTrigger>
            <TabsTrigger value="parents">Parent Management</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Link href="/dashboard/students/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </Link>
            </div>

            <Card>
              <CardContent className="pt-6">
                {(loadingStudents || loadingSchools) ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Guardian</TableHead>
                        <TableHead>Alerts</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                  No students found in {shardId || 'Global'} DB.
                              </TableCell>
                          </TableRow>
                      )}
                      {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors w-fit">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </div>
                                    <div className="text-left">
                                      <div className="font-semibold">{student.firstName} {student.lastName}</div>
                                      <div className="text-xs text-muted-foreground">{student.dateOfBirth}</div>
                                    </div>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="start">
                                  <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-semibold text-base">{student.firstName} {student.lastName}</h4>
                                        <p className="text-xs text-muted-foreground">{getSchoolName(student.education?.currentSchoolId?.value || student.schoolId)}</p>
                                      </div>
                                      <Link href={`/dashboard/students/${student.id}`}>
                                        <Button size="sm" variant="default" className="h-8">
                                          View Profile <ExternalLink className="ml-2 h-3 w-3" />
                                        </Button>
                                      </Link>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                                      <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Date of Birth</span>
                                        <span>{student.dateOfBirth || student.identity?.dateOfBirth?.value || "N/A"}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Gender</span>
                                        <span className="capitalize">{student.gender || student.identity?.gender?.value || "N/A"}</span>
                                      </div>
                                      <div className="col-span-2 flex flex-col">
                                        <span className="text-xs text-muted-foreground">Guardian</span>
                                        <span>{getParentName(student.parentId)}</span>
                                      </div>
                                    </div>
                                    
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditStudent(student.id)}>
                                        <Pencil className="h-3 w-3 mr-2" />
                                        Edit Details
                                    </Button>

                                    {(student.alerts && student.alerts.length > 0) ? (
                                       <div className="bg-red-50 p-2 rounded border border-red-200 text-xs text-red-800 flex items-start gap-2">
                                          <AlertTriangle className="h-4 w-4 shrink-0" />
                                          <div>
                                            <strong>Action Required:</strong> {student.alerts.length} active alerts linked to this student.
                                          </div>
                                       </div>
                                    ) : (
                                       <div className="bg-green-50 p-2 rounded border border-green-200 text-xs text-green-800 text-center">
                                          No active alerts.
                                       </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell>{getSchoolName(student.education?.currentSchoolId?.value || student.schoolId)}</TableCell>
                            <TableCell>
                              <span className="text-sm">{getParentName(student.parentId)}</span>
                            </TableCell>
                            <TableCell>
                              {Math.random() > 0.8 && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Review
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student.id)}>
                                      <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="parents" className="space-y-4">
           {/* Parent Tab Content (unchanged logic) */}
           <div className="flex justify-end">
              <Dialog open={isParentDialogOpen} onOpenChange={(open) => { setIsParentDialogOpen(open); if(!open) setEditingParentId(null); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Parent Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingParentId ? "Edit Parent" : "Add Parent Profile"}</DialogTitle>
                      <DialogDescription>Create a profile for a guardian.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveParent} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required defaultValue={editingParentId ? parents.find(p => p.id === editingParentId)?.displayName : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required defaultValue={editingParentId ? parents.find(p => p.id === editingParentId)?.email : ""} />
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="phone">Phone Number</Label>
                         <Input id="phone" name="phone" type="tel" defaultValue={editingParentId ? parents.find(p => p.id === editingParentId)?.phone : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" defaultValue={editingParentId ? parents.find(p => p.id === editingParentId)?.address : ""} />
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t">
                         <Label htmlFor="linkedStudentId">Link to Student</Label>
                         <Select name="linkedStudentId">
                            <SelectTrigger><SelectValue placeholder="Select Child" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {students.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Profile
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
           </div>
           
           <Card>
             <CardContent className="pt-6">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Children</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParents.map((p) => {
                          const children = students.filter(s => s.parentId === p.id || s.parentId === p.uid);
                          
                          return (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {p.displayName}
                                </TableCell>
                                <TableCell>{p.email}</TableCell>
                                <TableCell>{p.phone || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {children.length > 0 ? children.map(c => (
                                            <Badge key={c.id} variant="secondary" className="w-fit text-[10px]">
                                                {c.firstName}
                                            </Badge>
                                        )) : <span className="text-xs text-muted-foreground">None</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingParentId(p.id); setIsParentDialogOpen(true); }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteParent(p.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                </TableCell>
                            </TableRow>
                          );
                      })}
                    </TableBody>
                  </Table>
                )}
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* GLOBAL STUDENT EDIT DIALOG */}
      <StudentEditDialog 
        open={isStudentEditOpen} 
        onOpenChange={setIsStudentEditOpen} 
        studentId={editingStudentId || ''} 
        onSuccess={refreshStudents}
      />
    </div>
  );
}
