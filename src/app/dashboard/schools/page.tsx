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
  CardDescription
} from "@/components/ui/card";
import { Loader2, Plus, School as SchoolIcon, Search, UploadCloud, Pencil, Trash2, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchoolsPage() {
  const { data: schools, loading: loadingSchools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: districts, loading: loadingDistricts } = useFirestoreCollection<any>("districts", "name", "asc");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // District state
  const [isDistrictDialogOpen, setIsDistrictDialogOpen] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);

  const { toast } = useToast();

  // --- SCHOOLS LOGIC ---
  const handleSaveSchool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
        name: formData.get("name"),
        address: formData.get("address"),
        districtId: formData.get("districtId"),
        principalName: formData.get("principalName"),
        contactEmail: formData.get("contactEmail"),
        contactPhone: formData.get("contactPhone"),
        type: formData.get("type"),
        updatedAt: serverTimestamp(),
    };
    
    try {
       if (editingId) {
         await updateDoc(doc(db, "schools", editingId), data);
         toast({ title: "Updated", description: "School record updated." });
      } else {
         await addDoc(collection(db, "schools"), { ...data, createdAt: serverTimestamp() });
         toast({ title: "Enrolled", description: "New school added." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      await deleteDoc(doc(db, "schools", id));
  };

   const getDistrictName = (id: string) => {
      return districts.find(d => d.id === id)?.name || id;
   };

   const filteredSchools = schools.filter(s => 
     s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     getDistrictName(s.districtId).toLowerCase().includes(searchTerm.toLowerCase())
   );

   // --- DISTRICTS LOGIC ---
   const handleSaveDistrict = async (e: React.FormEvent<HTMLFormElement>) => {
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
      if (editingDistrictId) {
         await updateDoc(doc(db, "districts", editingDistrictId), data);
         toast({ title: "Updated", description: "District record updated." });
      } else {
         await addDoc(collection(db, "districts"), { ...data, createdAt: serverTimestamp() });
         toast({ title: "Created", description: "New educational district added." });
      }
      setIsDistrictDialogOpen(false);
      setEditingDistrictId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    if(!confirm("Delete this district?")) return;
    await deleteDoc(doc(db, "districts", id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Schools & Districts</h1>
        <p className="text-muted-foreground">Manage educational institutions and administrative districts.</p>
      </div>

      <Tabs defaultValue="schools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schools">Schools Registry</TabsTrigger>
          <TabsTrigger value="districts">Districts Management</TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schools..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingId(null); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Enroll School
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit School" : "Enroll New School"}</DialogTitle>
                      <DialogDescription>Add comprehensive details for the institution.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSchool} className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="name">School Name</Label>
                        <Input id="name" name="name" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.name : ""} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Textarea id="address" name="address" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.address : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="districtId">Educational District</Label>
                        <Select name="districtId" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.districtId : ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name} ({d.ward})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">School Type</Label>
                        <Input id="type" name="type" placeholder="Public, Private" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.type : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="principalName">Principal Name</Label>
                        <Input id="principalName" name="principalName" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.principalName : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input id="contactPhone" name="contactPhone" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.contactPhone : ""} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="contactEmail">Official Email</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" required defaultValue={editingId ? schools.find(s => s.id === editingId)?.contactEmail : ""} />
                      </div>

                      <DialogFooter className="col-span-2 mt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save School
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                {(loadingSchools || loadingDistricts) ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Name</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <SchoolIcon className="h-4 w-4 text-muted-foreground" />
                              {s.name}
                            </TableCell>
                            <TableCell>{getDistrictName(s.districtId)}</TableCell>
                            <TableCell>{s.principalName}</TableCell>
                            <TableCell>{s.contactEmail}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(s.id); setIsDialogOpen(true); }}>
                                      <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSchool(s.id)}>
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

        <TabsContent value="districts" className="space-y-4">
           <div className="flex justify-end">
              <Dialog open={isDistrictDialogOpen} onOpenChange={(open) => { setIsDistrictDialogOpen(open); if(!open) setEditingDistrictId(null); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add District
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDistrictId ? "Edit District" : "Add New District"}</DialogTitle>
                    <DialogDescription>Define the administrative area.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveDistrict} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">District Name</Label>
                      <Input id="name" name="name" required defaultValue={editingDistrictId ? districts.find(d => d.id === editingDistrictId)?.name : ""} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ward">Ward</Label>
                        <Input id="ward" name="ward" required defaultValue={editingDistrictId ? districts.find(d => d.id === editingDistrictId)?.ward : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lga">LGA</Label>
                        <Input id="lga" name="lga" required defaultValue={editingDistrictId ? districts.find(d => d.id === editingDistrictId)?.lga : ""} />
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
              <CardContent className="pt-6">
                {loadingDistricts ? (
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
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingDistrictId(d.id); setIsDistrictDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDistrict(d.id)}>
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
      </Tabs>
    </div>
  );
}
