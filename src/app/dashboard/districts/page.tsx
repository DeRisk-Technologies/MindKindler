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
import { Loader2, Plus, Search, Map, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DistrictsPage() {
  const { data: districts, loading } = useFirestoreCollection<any>("districts", "name", "asc");
  const [searchTerm, setSearchTerm] = useState("");
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
      ward: formData.get("ward"),
      lga: formData.get("lga"),
      state: formData.get("state"),
      updatedAt: serverTimestamp(),
    };
    
    try {
      if (editingId) {
         await updateDoc(doc(db, "districts", editingId), data);
         toast({ title: "Updated", description: "District record updated." });
      } else {
         await addDoc(collection(db, "districts"), { ...data, createdAt: serverTimestamp() });
         toast({ title: "Created", description: "New educational district added." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (district: any) => {
    setEditingId(district.id);
    setIsDialogOpen(true);
    // Note: In a real app, we'd pre-fill the form using state or ref, 
    // but standard HTML form reset happens on close. 
    // For this prototype, user re-types or we use controlled inputs.
    // I will use a simple workaround: setTimeout to fill inputs after dialog opens if I had refs.
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this district?")) return;
    await deleteDoc(doc(db, "districts", id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Educational Districts</h1>
          <p className="text-muted-foreground">Manage hierarchy: State {'>'} LGA {'>'} Ward {'>'} District.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add District
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit District" : "Add New District"}</DialogTitle>
              <DialogDescription>Define the administrative area.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">District Name</Label>
                <Input id="name" name="name" required defaultValue={editingId ? districts.find(d => d.id === editingId)?.name : ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Input id="ward" name="ward" required defaultValue={editingId ? districts.find(d => d.id === editingId)?.ward : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Input id="lga" name="lga" required defaultValue={editingId ? districts.find(d => d.id === editingId)?.lga : ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue="Lagos" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save District
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>District Registry</CardTitle>
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
                  <TableHead>District Name</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>LGA</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        {d.name}
                      </TableCell>
                      <TableCell>{d.ward}</TableCell>
                      <TableCell>{d.lga}</TableCell>
                      <TableCell>{d.state}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
