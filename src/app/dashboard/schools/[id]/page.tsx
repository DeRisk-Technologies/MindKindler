"use client";

import { useFirestoreCollection, useFirestoreDocument } from "@/hooks/use-firestore";
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
import { 
  Plus, 
  Search, 
  Loader2, 
  User, 
  AlertTriangle, 
  ExternalLink,
  School,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

export default function SchoolDetailsPage() {
  const { id } = useParams() as { id: string };
  const { shardId } = usePermissions();
  const { toast } = useToast();
  
  // Data Fetching
  const { data: school, loading: loadingSchool } = useFirestoreDocument<any>("schools", id);
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students", "lastName", "asc");
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users"); 
  
  // Fetch School Staff (Subcollection)
  // Assuming we store school staff in `schools/{id}/staff`
  // We need to construct the path dynamically. 
  // Note: useFirestoreCollection might need a way to handle dynamic subcollections better or we pass the path.
  // My custom hook supports path if I pass it as first arg? 
  // Looking at the hook implementation: `collection(targetDb, collectionName)`
  // Firestore `collection` function takes a path. So `schools/${id}/staff` should work if the hook allows it.
  const { data: staff, loading: loadingStaff, refresh: refreshStaff } = useFirestoreCollection<any>(`schools/${id}/staff`);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Filter students for this school
  const schoolStudents = students.filter(
    (s) => s.schoolId === id && 
    ((s.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
     (s.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()))
  );

  const getParentName = (parentId?: string) => {
    if (!parentId) return "Unknown";
    const parent = users.find(u => u.id === parentId || u.uid === parentId);
    return parent?.displayName || "Unknown";
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmittingStaff(true);
      const formData = new FormData(e.currentTarget);
      
      const newStaff = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          role: formData.get('role'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          department: formData.get('department'),
          isKeyContact: formData.get('isKeyContact') === 'on',
          createdAt: serverTimestamp()
      };

      try {
          const targetDb = shardId ? getRegionalDb(shardId.replace('mindkindler-', '')) : db;
          await addDoc(collection(targetDb, 'schools', id, 'staff'), newStaff);
          
          toast({ title: "Staff Added", description: `${newStaff.firstName} added to school roster.` });
          setIsAddStaffOpen(false);
          refreshStaff();
      } catch (err: any) {
          toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
          setIsSubmittingStaff(false);
      }
  };

  if (loadingSchool) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return <div className="p-8 text-center text-muted-foreground">School not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <School className="h-8 w-8" />
            {school.name}
          </h1>
          <div className="flex flex-col gap-1 mt-2 text-muted-foreground text-sm">
             <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {school.address || "No Address Provided"}
             </div>
             <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {school.email || "No Email"}
             </div>
             <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {school.phone || "No Phone"}
             </div>
             <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> {school.schoolType || "School"} • URN: {school.registrationNumber || "N/A"}
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Edit School</Button>
           <Link href="/dashboard/students/new">
             <Button>Add Student</Button>
           </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter(s => s.schoolId === id).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
               {students.filter(s => s.schoolId === id && s.alerts && s.alerts.length > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium truncate">{school.district || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList>
            <TabsTrigger value="students">Student Roster</TabsTrigger>
            <TabsTrigger value="staff">School Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
            <Card>
                <CardHeader>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>Directory of all students enrolled in this school.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search roster..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Grade/Class</TableHead>
                                <TableHead>Guardian</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {schoolStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                schoolStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors w-fit">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {student.firstName?.[0]}{student.lastName?.[0]}
                                            </div>
                                            <div>
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
                                                        <p className="text-xs text-muted-foreground">ID: {student.id.substring(0,8)}</p>
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
                                                        <span>{student.dateOfBirth || "N/A"}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Gender</span>
                                                        <span className="capitalize">{student.gender || "N/A"}</span>
                                                    </div>
                                                    <div className="col-span-2 flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Guardian</span>
                                                        <span>{getParentName(student.parentId)}</span>
                                                    </div>
                                                </div>

                                                {(student.alerts && student.alerts.length > 0) ? (
                                                    <div className="bg-red-50 p-2 rounded border border-red-200 text-xs text-red-800 flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                                        <div>
                                                            <strong>Alerts:</strong> {student.alerts.length} active issues.
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
                                    <TableCell>{student.diagnosisCategory ? student.diagnosisCategory.join(", ") : "General Education"}</TableCell>
                                    <TableCell>{getParentName(student.parentId)}</TableCell>
                                    <TableCell>
                                        {(student.alerts && student.alerts.length > 0) ? (
                                            <Badge variant="destructive">Needs Attention</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button variant="ghost" size="sm">
                                                Details
                                            </Button>
                                        </Link>
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

        <TabsContent value="staff">
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle>School Staff & Key Contacts</CardTitle>
                        <CardDescription>Teachers, SENCOs, and Administrators at this school.</CardDescription>
                     </div>
                     <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                         <DialogTrigger asChild>
                             <Button><Plus className="mr-2 h-4 w-4"/> Add Staff</Button>
                         </DialogTrigger>
                         <DialogContent>
                             <DialogHeader>
                                 <DialogTitle>Add School Staff</DialogTitle>
                             </DialogHeader>
                             <form onSubmit={handleAddStaff} className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                         <Label>First Name</Label>
                                         <Input name="firstName" required />
                                     </div>
                                     <div className="space-y-2">
                                         <Label>Last Name</Label>
                                         <Input name="lastName" required />
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Role</Label>
                                     <Select name="role" defaultValue="Teacher">
                                         <SelectTrigger><SelectValue /></SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="Principal">Principal / Head</SelectItem>
                                             <SelectItem value="SENCO">SENCO</SelectItem>
                                             <SelectItem value="Teacher">Class Teacher</SelectItem>
                                             <SelectItem value="TA">Teaching Assistant</SelectItem>
                                             <SelectItem value="Admin">Administrator</SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                         <Label>Email</Label>
                                         <Input name="email" type="email" />
                                     </div>
                                     <div className="space-y-2">
                                         <Label>Phone</Label>
                                         <Input name="phone" type="tel" />
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Department / Year Group</Label>
                                     <Input name="department" placeholder="e.g. Year 5, Science" />
                                 </div>
                                 <div className="flex items-center space-x-2">
                                     <input type="checkbox" name="isKeyContact" id="isKeyContact" className="h-4 w-4" />
                                     <Label htmlFor="isKeyContact">Key Contact for Consultations</Label>
                                 </div>
                                 <DialogFooter>
                                     <Button type="submit" disabled={isSubmittingStaff}>
                                         {isSubmittingStaff && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Staff
                                     </Button>
                                 </DialogFooter>
                             </form>
                         </DialogContent>
                     </Dialog>
                 </CardHeader>
                 <CardContent>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>Name</TableHead>
                                 <TableHead>Role</TableHead>
                                 <TableHead>Contact</TableHead>
                                 <TableHead>Department</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {loadingStaff && <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin inline"/></TableCell></TableRow>}
                             {!loadingStaff && staff.length === 0 && (
                                 <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No staff recorded for this school.</TableCell></TableRow>
                             )}
                             {staff.map((s: any) => (
                                 <TableRow key={s.id}>
                                     <TableCell className="font-medium">
                                         <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-slate-500" />
                                            {s.firstName} {s.lastName}
                                            {s.isKeyContact && <Badge variant="secondary" className="text-[10px] h-5">Key Contact</Badge>}
                                         </div>
                                     </TableCell>
                                     <TableCell>{s.role}</TableCell>
                                     <TableCell>
                                         <div className="flex flex-col text-xs">
                                             {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {s.email}</span>}
                                             {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {s.phone}</span>}
                                         </div>
                                     </TableCell>
                                     <TableCell>{s.department || "-"}</TableCell>
                                 </TableRow>
                             ))}
                         </TableBody>
                     </Table>
                 </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
