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
  Phone
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

export default function SchoolDetailsPage() {
  const { id } = useParams() as { id: string };
  const { data: school, loading: loadingSchool } = useFirestoreDocument<any>("schools", id);
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students", "lastName", "asc");
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users"); // For parent info lookup

  const [searchTerm, setSearchTerm] = useState("");

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
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Edit School</Button>
           <Button>Add Student</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter(s => s.schoolId === id).length}</div>
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
            <div className="text-lg font-medium truncate">{school.district || "Unknown"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Roster */}
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
    </div>
  );
}
