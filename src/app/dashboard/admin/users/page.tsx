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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Pencil, Search, KeyRound, UploadCloud, User, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserData {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  role: string;
  departmentId?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

const roles = [
  "Admin",
  "EducationalPsychologist",
  "Teacher",
  "Parent",
  "Student",
  "SchoolAdministrator",
  "LocalEducationAuthority",
  "ClinicalPsychologist",
  "TrainingDesigner",
  "HR",
];

export default function AdminUsersPage() {
  const { data: users, loading: loadingUsers } = useFirestoreCollection<UserData>("users", "createdAt", "desc");
  const { data: departments } = useFirestoreCollection<any>("departments", "name", "asc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserData | null>(null);

  const { toast } = useToast();
  
  // Filter users
  const filteredUsers = users.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
        displayName: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        departmentId: formData.get("departmentId"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        updatedAt: serverTimestamp(),
    };
    
    try {
      if (editingId) {
         await updateDoc(doc(db, "users", editingId), data);
         toast({ title: "User Updated", description: "Profile details saved." });
      } else {
         // Note: Creating Auth user server-side is required for real login. 
         // Here we simulate the Firestore profile creation.
         await addDoc(collection(db, "users"), {
            ...data,
            uid: "generated_by_admin_" + Math.random().toString(36),
            createdAt: new Date().toISOString(), 
         });
         toast({ title: "User Added", description: "User record created in database." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
      if (!selectedUserForPassword?.email) return;
      setIsSubmitting(true);
      
      try {
          await sendPasswordResetEmail(auth, selectedUserForPassword.email);
          toast({ 
              title: "Email Sent", 
              description: `Password reset link sent to ${selectedUserForPassword.email}.` 
          });
          setIsPasswordDialogOpen(false);
      } catch (error: any) {
          toast({ 
              title: "Error", 
              description: error.message, 
              variant: "destructive" 
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This removes the profile from the database.")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast({ title: "Deleted", description: "User removed." });
    } catch (e: any) {
      toast({ title: "Error", variant: "destructive", description: e.message });
    }
  };

  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || "-";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
        <p className="text-muted-foreground">
          Administer users, roles, departments, and permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-96">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search users..." 
                      className="pl-8"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Edit User Profile" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                      Manage comprehensive user details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">Account & Role</TabsTrigger>
                            <TabsTrigger value="profile">Personal Profile</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="account" className="space-y-4 pt-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required defaultValue={editingId ? users.find(u => u.id === editingId)?.displayName : ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required defaultValue={editingId ? users.find(u => u.id === editingId)?.email : ""} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select name="role" defaultValue={editingId ? users.find(u => u.id === editingId)?.role : "teacher"}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem key={r} value={r.toLowerCase()}>{r.replace(/([A-Z])/g, " $1")}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select name="departmentId" defaultValue={editingId ? users.find(u => u.id === editingId)?.departmentId : "none"}>
                                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {departments.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="profile" className="space-y-4 pt-4">
                             <div className="flex items-center gap-4 mb-2">
                                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <Button size="sm" variant="secondary" type="button">Upload Photo</Button>
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" type="tel" defaultValue={editingId ? users.find(u => u.id === editingId)?.phone : ""} />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" name="address" defaultValue={editingId ? users.find(u => u.id === editingId)?.address : ""} />
                             </div>
                             <div className="space-y-2">
                                <Label>Documents</Label>
                                <div className="border-2 border-dashed rounded p-4 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/50">
                                    <UploadCloud className="h-6 w-6 mx-auto mb-1" />
                                    Upload CV / Certificates
                                </div>
                             </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
           </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
             <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {user.displayName ? user.displayName.substring(0,2).toUpperCase() : "U"}
                            </div>
                            {user.displayName || "N/A"}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDeptName(user.departmentId)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => { setSelectedUserForPassword(user); setIsPasswordDialogOpen(true); }}>
                               <KeyRound className="h-4 w-4 text-orange-500" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => { setEditingId(user.id); setIsDialogOpen(true); }}>
                               <Pencil className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                      Send a password reset email to <b>{selectedUserForPassword?.email}</b>.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-sm text-muted-foreground">
                  <p>For security reasons, administrators cannot set passwords directly. This action will send an automated email to the user with a link to choose a new password securely.</p>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendResetEmail} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
