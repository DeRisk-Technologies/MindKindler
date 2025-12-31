"use client";

import { useState } from "react";
import { Case } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Image as ImageIcon, Video, Music, MoreVertical, Download, Eye, UploadCloud } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CaseFilesProps {
  caseData: Case;
}

export function CaseFiles({ caseData }: CaseFilesProps) {
  // Mock Files
  const [files, setFiles] = useState([
    { id: "f1", name: "Consent Form.pdf", type: "document", size: "1.2 MB", date: "2023-09-01", tag: "Admin" },
    { id: "f2", name: "Classroom Obs.mp4", type: "video", size: "45 MB", date: "2023-10-12", tag: "Observation" },
    { id: "f3", name: "Handwriting Sample.jpg", type: "image", size: "3.5 MB", date: "2023-10-15", tag: "Assessment" },
    { id: "f4", name: "Interview.mp3", type: "audio", size: "8 MB", date: "2023-10-20", tag: "Interview" },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'image': return <ImageIcon className="h-4 w-4 text-purple-500" />;
      case 'audio': return <Music className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Input placeholder="Search files..." className="w-[250px]" />
         </div>
         <Button>
           <UploadCloud className="mr-2 h-4 w-4" /> Upload File
         </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Documents & Media</CardTitle>
          <CardDescription>All files associated with this case.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{getIcon(file.type)}</TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.tag}</Badge>
                  </TableCell>
                  <TableCell>{new Date(file.date).toLocaleDateString()}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                           Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
