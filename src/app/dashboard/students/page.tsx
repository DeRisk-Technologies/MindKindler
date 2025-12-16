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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Loader2, UploadCloud, User, AlertTriangle, Pencil, Trash2, Users, FileText } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students", "lastName", "asc");
  const { data: schools, loading: loadingSchools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users", "displayName", "asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Parent state
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);

  const { toast } = useToast();

  const parents = users.filter(u => u.role === 'parent');

  // SAFE FILTERING: Handle potentially undefined fields
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

  // --- STUDENT LOGIC ---
  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        dateOfBirth: formData.get("dob"),
        gender: formData.get("gender"),
        schoolId: formData.get("schoolId"), 
        parentId: formData.get("parentId"), 
        address: formData.get("address"),
        updatedAt: serverTimestamp(),
    };
    
    try {
      if (editingId) {
        await updateDoc(doc(db, "students", editingId), data);
        toast({ title: "Updated", description: "Student profile updated." });
      } else {
        await addDoc(collection(db, "students"), { 
            ...data, 
            history: [], 
            alerts: [], 
            createdAt: serverTimestamp() 
        });
        toast({ title: "Created", description: "Successfully added new student." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if(!confirm("Are you sure you want to delete this student?")) return;
    await deleteDoc(doc(db, "students", id));
  };

  const getSchoolName = (id: string) => schools.find(s => s.id === id)?.name || id;
  const getParentName = (id: string | undefined) => {
      if (!id) return "No Parent Linked";
      const p = users.find(u => u.id === id || u.uid === id); 
      return p ? p.displayName : "Unknown Parent";
  };

  // --- PARENT LOGIC ---
  const handleSaveParent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Logic for linking to student on creation
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
        if (editingParentId) {
            parentRef = doc(db, "users", editingParentId);
            await updateDoc(parentRef, data);
            toast({ title: "Updated", description: "Parent profile updated." });
        } else {
             // Mock UID for prototype
             const newDoc = await addDoc(collection(db, "users"), { 
                 ...data, 
                 uid: "gen_parent_" + Math.random().toString(36),
                 createdAt: serverTimestamp() 
             });
             parentRef = newDoc;
             toast({ title: "Created", description: "Parent profile added." });
        }

        // If a student was linked, we should ideally update the student record too (bidirectional)
        if (linkedStudentId && linkedStudentId !== "none") {
             const studentRef = doc(db, "students", linkedStudentId as string);
             // We update the student to point to this parent
             // Note: In real app, consider using a batch write for atomicity
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
      await deleteDoc(doc(db, "users", id));
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
                 <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Student Profile" : "Add New Student Profile"}</DialogTitle>
                      <DialogDescription>Enter comprehensive details. Use tabs for different sections.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4">
                      <form id="student-form" onSubmit={handleSaveStudent} className="space-y-4 p-1">
                        <Tabs defaultValue="personal" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="personal">Personal & School</TabsTrigger>
                            <TabsTrigger value="family">Family & Guardian</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="personal" className="space-y-4 pt-4">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:bg-secondary/80">
                                <User className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Upload Student Photo</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" required defaultValue={editingId ? students.find(s => s.id === editingId)?.firstName : ""} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" required defaultValue={editingId ? students.find(s => s.id === editingId)?.lastName : ""} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" name="dob" type="date" required defaultValue={editingId ? students.find(s => s.id === editingId)?.dateOfBirth : ""} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" defaultValue={editingId ? students.find(s => s.id === editingId)?.gender : "Male"}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Residential Address</Label>
                              <Textarea id="address" name="address" required defaultValue={editingId ? students.find(s => s.id === editingId)?.address : ""} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="schoolId">Current School</Label>
                              <Select name="schoolId" required defaultValue={editingId ? students.find(s => s.id === editingId)?.schoolId : ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select School" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {schools.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                          </TabsContent>

                          <TabsContent value="family" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentId">Link Parent</Label>
                                <Select name="parentId" defaultValue={editingId ? students.find(s => s.id === editingId)?.parentId : ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Existing Parent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {parents.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.displayName} ({p.email})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Select an existing parent user account.</p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </form>
                    </ScrollArea>
                    <DialogFooter className="py-4">
                        <Button form="student-form" type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Student Profile
                        </Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                      {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {student.firstName?.[0]}{student.lastName?.[0]}
                                </div>
                                <div>
                                  <div>{student.firstName} {student.lastName}</div>
                                  <div className="text-xs text-muted-foreground">{student.dateOfBirth}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getSchoolName(student.schoolId)}</TableCell>
                            <TableCell>
                              <span className="text-sm">{getParentName(student.parentId)}</span>
                            </TableCell>
                            <TableCell>
                              {/* Mock logic for alert display */}
                              {Math.random() > 0.8 && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Review
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(student.id); setIsDialogOpen(true); }}>
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
                      
                      {/* Linking Student Section */}
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
                         <p className="text-xs text-muted-foreground">This will link the student to this parent.</p>
                      </div>

                      <div className="space-y-2">
                         <Label>Proof of Relationship (Evidence)</Label>
                         <div className="border-2 border-dashed rounded p-4 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/50">
                            <UploadCloud className="h-6 w-6 mx-auto mb-1" />
                            Upload Birth Certificate / Court Order
                         </div>
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
                          // Find children linked to this parent
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
    </div>
  );
}
