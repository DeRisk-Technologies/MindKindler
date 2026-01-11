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
import { Loader2, Plus, School as SchoolIcon, Search, Pencil, Trash2, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Phase 29 Imports
import { SchoolsMap } from "@/components/maps/SchoolsMap"; 
import { SchoolForm } from "@/components/schools/SchoolForm"; 

export default function SchoolsPage() {
  const { data: schools, loading: loadingSchools, refresh: refreshSchools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: districts, loading: loadingDistricts } = useFirestoreCollection<any>("districts", "name", "asc");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  
  // District state
  const [isDistrictDialogOpen, setIsDistrictDialogOpen] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

   const getDistrictName = (id: string) => {
      return districts.find(d => d.id === id)?.name || id;
   };

   const filteredSchools = schools.filter(s => 
     s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     getDistrictName(s.districtId).toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleDeleteSchool = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      await deleteDoc(doc(db, "schools", id));
      refreshSchools(); // Ensure UI updates
  };

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
          <TabsTrigger value="map">GIS Map View</TabsTrigger> {/* New Map Tab */}
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
                
                {/* Phase 29: Rich School Form Dialog */}
                <Dialog open={isSchoolDialogOpen} onOpenChange={(open) => { setIsSchoolDialogOpen(open); if(!open) setEditingSchool(null); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Enroll School
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSchool ? "Edit School Profile" : "Enroll New School"}</DialogTitle>
                      <DialogDescription>Manage comprehensive details, SENCO contact, and GIS location.</DialogDescription>
                    </DialogHeader>
                    
                    <SchoolForm 
                        initialData={editingSchool} 
                        onSave={() => { 
                            setIsSchoolDialogOpen(false); 
                            setEditingSchool(null); 
                            refreshSchools(); // Refresh list after save
                        }} 
                    />

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
                        <TableHead>SENCO</TableHead> {/* Updated Column */}
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
                            <TableCell>{s.principalName || 'N/A'}</TableCell>
                            <TableCell>{s.senco?.name || 'N/A'}</TableCell> {/* Display SENCO */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingSchool(s); setIsSchoolDialogOpen(true); }}>
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

        {/* Phase 29: Map Tab */}
        <TabsContent value="map">
            <Card>
                <CardHeader>
                    <CardTitle>Geographic Overview</CardTitle>
                    <CardDescription>Visualizing {filteredSchools.length} schools across the region.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <SchoolsMap schools={filteredSchools} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="districts" className="space-y-4">
           {/* Existing District Logic (Unchanged) */}
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
