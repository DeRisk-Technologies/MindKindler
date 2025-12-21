"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Report } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Edit, Plus, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AdhocReportGenerator } from "@/components/dashboard/reports/adhoc-generator";
import { TranslatorTool } from "@/components/dashboard/translator";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: reports, loading } = useFirestoreCollection<Report>("reports", "createdAt", "desc");

  const handleDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, "reports", id));
          toast({ title: "Report deleted" });
      } catch (e) {
          console.error(e);
          toast({ title: "Error deleting report", variant: "destructive" });
      }
  };

  const columns: ColumnDef<Report>[] = [
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-blue-500" />
                {row.getValue("title") || "Untitled Report"}
            </div>
        )
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="capitalize">{row.getValue("type")?.toString().replace("_", " ")}</span>
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.getValue("status") === 'final' ? 'default' : 'outline'}>
                {row.getValue("status")}
            </Badge>
        )
    },
    {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => {
            const date = row.getValue("createdAt");
            return date ? format(new Date(date as any), "MMM d, yyyy") : "-";
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const report = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/reports/editor/${report.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(report.id)}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
  ];

  return (
    <div className="space-y-8 p-8 pt-6">
       <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">Reports & Documents</h1>
             <p className="text-muted-foreground">Manage generated assessments, consultation summaries, and translations.</p>
          </div>
          <div className="flex gap-2">
              <AdhocReportGenerator />
              <Button onClick={() => router.push('/dashboard/reports/templates')}>
                  <Plus className="mr-2 h-4 w-4" /> Template Designer
              </Button>
          </div>
       </div>

       <Tabs defaultValue="library" className="space-y-4">
           <TabsList>
               <TabsTrigger value="library">Library</TabsTrigger>
               <TabsTrigger value="tools">Tools & Translation</TabsTrigger>
           </TabsList>

           <TabsContent value="library">
               <Card>
                   <CardHeader>
                       <CardTitle>Report Library</CardTitle>
                       <CardDescription>
                           Search, filter, and manage all your clinical documentation.
                       </CardDescription>
                   </CardHeader>
                   <CardContent>
                       <DataTable 
                           columns={columns} 
                           data={reports} 
                           searchKey="title" 
                           filterableColumns={[
                               { 
                                   id: "status", 
                                   title: "Status", 
                                   options: [{label: "Draft", value: "draft"}, {label: "Final", value: "final"}] 
                               },
                               {
                                   id: "type",
                                   title: "Type",
                                   options: [
                                       {label: "Clinical Summary", value: "clinical_summary"},
                                       {label: "Progress Note", value: "progress_note"},
                                       {label: "IEP Draft", value: "iep_draft"}
                                   ]
                               }
                           ]}
                        />
                   </CardContent>
               </Card>
           </TabsContent>

           <TabsContent value="tools">
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                   <div className="lg:col-span-2">
                       <TranslatorTool />
                   </div>
                   <div className="space-y-6">
                       <Card>
                           <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
                           <CardContent className="space-y-2">
                               <Button variant="outline" className="w-full justify-start">DSM-5 Reference</Button>
                               <Button variant="outline" className="w-full justify-start">ICD-10 Codes</Button>
                               <Button variant="outline" className="w-full justify-start">Intervention Bank</Button>
                           </CardContent>
                       </Card>
                   </div>
               </div>
           </TabsContent>
       </Tabs>
    </div>
  );
}
