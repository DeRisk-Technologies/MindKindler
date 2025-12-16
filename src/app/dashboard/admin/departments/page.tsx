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
import { Loader2, Plus, Trash2, Pencil, Users, Layers, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function DepartmentsPage() {
  const { data: departments, loading: loadingDepts } = useFirestoreCollection<any>("departments", "name", "asc");
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users", "displayName", "asc");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
        name: formData.get("name"),
        description: formData.get("description"),
        headId: formData.get("headId"),
        updatedAt: serverTimestamp(),
    };
    
    try {
      if (editingId) {
         await updateDoc(doc(db, "departments", editingId), data);
         toast({ title: "Updated", description: "Department updated." });
      } else {
         await addDoc(collection(db, "departments"), { ...data, members: [], createdAt: serverTimestamp() });
         toast({ title: "Created", description: "New department created." });
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
    if (!confirm("Are you sure? This will not delete the users inside.")) return;
    await deleteDoc(doc(db, "departments", id));
  };

  const getUserName = (id: string) => {
      const u = users.find(user => user.id === id || user.uid === id);
      return u ? u.displayName : "None";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Departments & Groups</h1>
        <p className="text-muted-foreground">Organize users into structural teams.</p>
      </div>

      <div className="flex justify-end">
           <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Department" : "New Department"}</DialogTitle>
                <DialogDescription>Define a new organizational unit.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input id="name" name="name" placeholder="e.g. Clinical Services" required defaultValue={editingId ? departments.find(d => d.id === editingId)?.name : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingId ? departments.find(d => d.id === editingId)?.description : ""} />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="headId">Head of Department</Label>
                   <Select name="headId" defaultValue={editingId ? departments.find(d => d.id === editingId)?.headId : ""}>
                      <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {users.map(u => (
                              <SelectItem key={u.id} value={u.uid || u.id}>{u.displayName} ({u.role})</SelectItem>
                          ))}
                      </SelectContent>
                   </Select>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map(dept => (
              <Card key={dept.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-lg font-medium">{dept.name}</CardTitle>
                      <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-xs text-muted-foreground mb-4">{dept.description || "No description"}</div>
                      <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Head:</span>
                              <span className="font-medium">{getUserName(dept.headId)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Members:</span>
                              <span className="font-medium">{users.filter(u => u.departmentId === dept.id).length}</span>
                          </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => { setEditingId(dept.id); setIsDialogOpen(true); }}>
                              <Pencil className="mr-2 h-3 w-3" /> Edit
                          </Button>
                          <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => handleDelete(dept.id)}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>
    </div>
  );
}
