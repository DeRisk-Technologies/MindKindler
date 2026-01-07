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
import { Loader2, Plus, Trash2, Pencil, Search, KeyRound, UploadCloud, User, Mail, ShieldAlert, Building, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, Firestore } from "firebase/firestore";
import { db, auth, getRegionalDb } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/use-permissions";

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
  tenantId?: string; // To distinguish Internal vs External
}

// Internal Staff Roles
const STAFF_ROLES = [
    "SuperAdmin",
    "Developer",
    "SupportAgent",
    "BillingAdmin"
];

// Customer Roles
const CUSTOMER_ROLES = [
  "TenantAdmin",
  "SchoolAdmin",
  "EducationalPsychologist",
  "ClinicalPsychologist",
  "Teacher",
  "Parent",
  "Student",
  "GovAnalyst"
];

// Available Shards for Admin View
const AVAILABLE_SHARDS = [
    { id: 'default', name: 'Global / Default', region: 'global' },
    { id: 'mindkindler-uk', name: 'UK Shard', region: 'uk' },
    { id: 'mindkindler-us', name: 'US Shard', region: 'us' },
    { id: 'mindkindler-eu', name: 'EU Shard', region: 'eu' },
    { id: 'mindkindler-asia', name: 'Asia Shard', region: 'asia' },
    { id: 'mindkindler-me', name: 'Middle East Shard', region: 'me' }
];

export default function AdminUsersPage() {
  const { shardId: myShardId, hasRole } = usePermissions();
  const isSuperAdmin = hasRole(['SuperAdmin']);

  // Admin View Control
  const [viewShard, setViewShard] = useState<string>('default');

  // Sync viewShard with myShardId initially if not SuperAdmin (locked to region)
  useEffect(() => {
      if (myShardId && !isSuperAdmin) {
          setViewShard(myShardId);
      } else if (myShardId && isSuperAdmin && viewShard === 'default') {
          // SuperAdmins start at default but can switch. 
          // If myShardId is region specific, they might want to see that first?
          // Let's keep default for SuperAdmin.
      }
  }, [myShardId, isSuperAdmin]);

  const { data: users, loading: loadingUsers } = useFirestoreCollection<UserData>(
      "users", 
      "createdAt", 
      "desc",
      { targetShard: viewShard }
  );
  
  const { data: departments } = useFirestoreCollection<any>("departments", "name", "asc");
  const { data: tenants, loading: loadingTenants } = useFirestoreCollection<any>("organizations", "name", "asc"); 

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("customers");

  const { toast } = useToast();
  
  // Filter logic: Separate Staff from Customers
  const filteredUsers = users.filter(u => {
      const matchesSearch = 
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === "staff") {
          return STAFF_ROLES.includes(u.role) || u.email.endsWith("@mindkindler.com");
      } else {
          return !STAFF_ROLES.includes(u.role) && !u.email.endsWith("@mindkindler.com");
      }
  });

  const getTargetDb = () => {
      if (viewShard === 'default') return db;
      const region = viewShard.replace('mindkindler-', '');
      return getRegionalDb(region);
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const role = formData.get("role") as string;
    // Auto-assign tenantId based on role, fallback to form value
    const formTenantId = formData.get("tenantId") as string;
    const tenantId = STAFF_ROLES.includes(role) ? "mindkindler-hq" : (formTenantId || "default");

    const data = {
        displayName: formData.get("name"),
        email: formData.get("email"),
        role: role,
        departmentId: formData.get("departmentId"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        tenantId: tenantId,
        updatedAt: serverTimestamp(),
    };
    
    try {
      const targetDb = getTargetDb();

      if (editingId) {
         await updateDoc(doc(targetDb, "users", editingId), data);
         toast({ title: "User Updated", description: "Profile details saved." });
      } else {
         // Create dummy placeholder for now
         await addDoc(collection(targetDb, "users"), {
            ...data,
            uid: "generated_" + Math.random().toString(36),
            createdAt: new Date().toISOString(), 
         });
         toast({ title: "User Added", description: "User record created." });
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
          toast({ title: "Email Sent", description: `Reset link sent to ${selectedUserForPassword.email}.` });
          setIsPasswordDialogOpen(false);
      } catch (error: any) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This removes the profile.")) return;
    try {
      const targetDb = getTargetDb();
      await deleteDoc(doc(targetDb, "users", id));
      toast({ title: "Deleted", description: "User removed." });
    } catch (e: any) {
      toast({ title: "Error", variant: "destructive", description: e.message });
    }
  };

  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || "-";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Global User Directory</h1>
            <p className="text-muted-foreground">Manage internal staff and customer accounts.</p>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Shard Selector */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <Globe className="h-4 w-4 ml-2 text-muted-foreground" />
                <Select value={viewShard} onValueChange={setViewShard} disabled={!isSuperAdmin}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none w-[180px] h-8 text-xs font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_SHARDS.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
                <DialogTrigger asChild>
                    <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                    <DialogTitle>{editingId ? "Edit Profile" : "Create User"}</DialogTitle>
                    <DialogDescription>Provision access in <b>{AVAILABLE_SHARDS.find(s=>s.id===viewShard)?.name}</b>.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">Account</TabsTrigger>
                            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                                    <Label>Role Category</Label>
                                    <Select name="role" defaultValue={editingId ? users.find(u => u.id === editingId)?.role : "Teacher"}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <div className="px-2 py-1 text-xs font-bold text-muted-foreground">Internal Staff</div>
                                            {STAFF_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            <div className="px-2 py-1 text-xs font-bold text-muted-foreground border-t mt-1">Customers</div>
                                            {CUSTOMER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select name="departmentId" defaultValue={editingId ? users.find(u => u.id === editingId)?.departmentId : "none"}>
                                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* NEW: Tenant Selector (Replacing Input) */}
                            <div className="space-y-2">
                                <Label htmlFor="tenantId" className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-slate-500" />
                                    Tenant Context
                                </Label>
                                <Select name="tenantId" defaultValue={editingId ? users.find(u => u.id === editingId)?.tenantId : "default"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">System Default (Dev)</SelectItem>
                                        {tenants.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.region})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Assign this user to an organization workspace.
                                </p>
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
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={editingId ? users.find(u => u.id === editingId)?.phone : ""} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" name="address" defaultValue={editingId ? users.find(u => u.id === editingId)?.address : ""} />
                                </div>
                        </TabsContent>
                    </Tabs>

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
      </div>

      <Tabs defaultValue="customers" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
                value="customers" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
                Customer Users
            </TabsTrigger>
            <TabsTrigger 
                value="staff" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 flex items-center gap-2"
            >
                <ShieldAlert className="h-4 w-4"/> MindKindler Staff
            </TabsTrigger>
        </TabsList>

        <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                {loadingUsers ? (
                    <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No users found in {AVAILABLE_SHARDS.find(s=>s.id===viewShard)?.name}.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${activeTab === 'staff' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'}`}>
                                            {user.displayName ? user.displayName.substring(0,2).toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{user.displayName}</div>
                                            {user.uid && <div className="text-[10px] text-muted-foreground font-mono">{user.uid.slice(0,8)}...</div>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                <Badge variant={activeTab === 'staff' ? 'default' : 'outline'} className="capitalize">
                                    {user.role}
                                </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {activeTab === 'staff' ? <ShieldAlert className="h-3 w-3 text-purple-600"/> : <Building className="h-3 w-3 text-slate-500"/>}
                                        <span className="text-sm">{activeTab === 'staff' ? 'MindKindler HQ' : (user.tenantId || 'Unknown Org')}</span>
                                    </div>
                                </TableCell>
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
                            ))
                        )}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
      </Tabs>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                      Send a password reset email to <b>{selectedUserForPassword?.email}</b>.
                  </DialogDescription>
              </DialogHeader>
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
