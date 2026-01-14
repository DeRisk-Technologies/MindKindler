// src/app/dashboard/schools/page.tsx
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
import { Loader2, Plus, School as SchoolIcon, Search, Pencil, Trash2, Map, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getRegionalDb } from "@/lib/firebase"; // Import Regional DB helper
import { useAuth } from "@/hooks/use-auth"; // Auth for region resolution
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For District Form

// Phase 29 Imports
import { SchoolForm } from "@/components/schools/SchoolForm"; 

// Dynamic Import for Map (Fixes 'window is not defined')
const SchoolsMap = dynamic(() => import('@/components/maps/SchoolsMap').then(mod => mod.SchoolsMap), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-slate-100 rounded-lg animate-pulse text-muted-foreground">Loading GIS Map...</div>
});

// Mock District Options (To be replaced by real API or robust static list later)
const UK_REGIONS = ["London", "South East", "North West", "West Midlands", "East of England"];
const LONDON_BOROUGHS = ["Camden", "Hackney", "Islington", "Lambeth", "Southwark", "Westminster", "Barnet", "Brent", "Ealing"];

export default function SchoolsPage() {
  const { user } = useAuth();
  const { data: schools, loading: loadingSchools, refresh: refreshSchools } = useFirestoreCollection<any>("schools", "name", "asc");
  const { data: districts, loading: loadingDistricts } = useFirestoreCollection<any>("districts", "name", "asc");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  
  // District state
  const [isDistrictDialogOpen, setIsDistrictDialogOpen] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Districts
  const [districtRegion, setDistrictRegion] = useState("London");

  const { toast } = useToast();

   // Resolve DB Instance based on User Region
   const getDb = () => {
       const region = user?.region || 'uk';
       return getRegionalDb(region);
   };

   const getDistrictName = (id: string) => {
      if (!districts) return id || 'Unknown';
      return districts.find(d => d.id === id)?.name || id || 'Unknown';
   };

   const filteredSchools = schools ? schools.filter(s => {
     const nameMatch = (s.name || "").toLowerCase().includes(searchTerm.toLowerCase());
     const districtMatch = getDistrictName(s.districtId).toLowerCase().includes(searchTerm.toLowerCase());
     return nameMatch || districtMatch;
   }) : [];

   const handleDeleteSchool = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      try {
          const db = getDb();
          await deleteDoc(doc(db, "schools", id));
          toast({ title: "Deleted", description: "School removed." });
          refreshSchools(); 
      } catch (e) {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
      }
  };

   // --- DISTRICTS LOGIC ---
   const handleSaveDistrict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId: user.tenantId, // Ensure tenant scoping
      name: formData.get("name"),
      ward: formData.get("ward"),
      lga: formData.get("lga"), // Keeping 'lga' for data consistency but label can change
      state: formData.get("state"), // or 'Region'
      type: formData.get("type"), // 'LEA', 'Trust', 'Independent'
      updatedAt: new Date().toISOString(),
    };
    
    try {
      const db = getDb(); // Use Regional DB
      
      if (editingDistrictId) {
         await updateDoc(doc(db, "districts", editingDistrictId), data);
         toast({ title: "Updated", description: "District record updated." });
      } else {
         await addDoc(collection(db, "districts"), { ...data, createdAt: new Date().toISOString() });
         toast({ title: "Created", description: "New educational district added." });
      }
      setIsDistrictDialogOpen(false);
      setEditingDistrictId(null);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    if(!confirm("Delete this district?")) return;
    try {
        const db = getDb();
        await deleteDoc(doc(db, "districts", id));
        toast({ title: "Deleted" });
    } catch(e) {
        toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Schools & Districts</h1>
        <p className="text-muted-foreground">Manage educational institutions and administrative districts.</p>
      </div>

      <Tabs defaultValue="schools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schools">Schools Registry</TabsTrigger>
          <TabsTrigger value="map">GIS Map View</TabsTrigger>
          <TabsTrigger value="districts">Districts & LAs</TabsTrigger>
        </TabsList>

        {/* SCHOOLS TAB */}
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
                        // Pass available districts for selection in SchoolForm (Updated SchoolForm will need this prop)
                        onSave={() => { 
                            setIsSchoolDialogOpen(false); 
                            setEditingSchool(null); 
                            refreshSchools(); 
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
                        <TableHead>Type</TableHead>
                        <TableHead>District / LA</TableHead>
                        <TableHead>SENCO</TableHead> 
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No schools found.</TableCell>
                          </TableRow>
                      ) : (
                          filteredSchools.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                  <SchoolIcon className="h-4 w-4 text-muted-foreground" />
                                  {s.name}
                                </TableCell>
                                <TableCell className="capitalize">{s.type || 'Primary'}</TableCell>
                                <TableCell>{getDistrictName(s.districtId)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{s.senco?.name || 'N/A'}</span>
                                        <span className="text-xs text-muted-foreground">{s.senco?.email}</span>
                                    </div>
                                </TableCell>
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
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        </TabsContent>

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

        {/* DISTRICTS TAB - ENHANCED */}
        <TabsContent value="districts" className="space-y-4">
           <div className="flex justify-end">
              <Dialog open={isDistrictDialogOpen} onOpenChange={(open) => { setIsDistrictDialogOpen(open); if(!open) setEditingDistrictId(null); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Local Authority
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDistrictId ? "Edit Authority" : "Add Local Authority / District"}</DialogTitle>
                    <DialogDescription>Define administrative boundaries for reporting.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveDistrict} className="space-y-4">
                    
                    <div className="space-y-2">
                        <Label>Authority Type</Label>
                        <Select name="type" defaultValue="LEA">
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LEA">Local Education Authority (LEA)</SelectItem>
                                <SelectItem value="Trust">Multi-Academy Trust (MAT)</SelectItem>
                                <SelectItem value="Independent">Independent Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Region</Label>
                      <Select name="state" defaultValue="London" onValueChange={setDistrictRegion}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {UK_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Authority Name (e.g. Borough)</Label>
                      {/* Smart preset based on Region */}
                      {districtRegion === 'London' ? (
                          <Select name="name" defaultValue="Camden">
                              <SelectTrigger><SelectValue placeholder="Select Borough"/></SelectTrigger>
                              <SelectContent>
                                  {LONDON_BOROUGHS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                  <SelectItem value="Other">Other...</SelectItem>
                              </SelectContent>
                          </Select>
                      ) : (
                          <Input name="name" placeholder="e.g. Manchester City Council" required />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lga">Code (LA Number)</Label>
                        <Input id="lga" name="lga" placeholder="e.g. 202" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ward">Ward / Sub-Area</Label>
                        <Input id="ward" name="ward" placeholder="Optional" />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Authority
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
                        <TableHead>Authority Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>LA Code</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {districts.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {d.name}
                            </TableCell>
                            <TableCell><div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">{d.type || 'LEA'}</div></TableCell>
                            <TableCell>{d.state}</TableCell>
                            <TableCell>{d.lga}</TableCell>
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
