"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DocumentCategory } from "@/types/schema";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assumes you have storage setup, ignoring actual binary upload for this prototype

// Mock storage upload function
const uploadFileToStorage = async (file: File) => {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://storage.googleapis.com/mock-bucket/${file.name}`), 1500);
    });
};

export function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop,
      accept: {
          'application/pdf': ['.pdf'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'text/csv': ['.csv'],
          'image/*': ['.png', '.jpeg', '.jpg']
      },
      maxFiles: 1
  });

  const handleUpload = async () => {
      if (!file || !category) return;
      setUploading(true);
      setProgress(10);

      try {
          // 1. Upload Binary
          const url = await uploadFileToStorage(file);
          setProgress(50);

          // 2. Create Document Record
          await addDoc(collection(db, "documents"), {
              userId: "current_user_id", // Replace with auth context
              fileName: file.name,
              fileUrl: url,
              fileType: file.type,
              category,
              uploadDate: new Date().toISOString(),
              status: 'uploading', // Cloud Function will pick this up -> 'processing' -> 'review_required'
              createdAt: serverTimestamp()
          });
          setProgress(100);
          
          toast({ title: "Upload Complete", description: "Document queued for processing." });
          setFile(null);
          setCategory("");
      } catch (e) {
          toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
      } finally {
          setUploading(false);
          setTimeout(() => setProgress(0), 2000);
      }
  };

  return (
    <Card className="w-full">
        <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
                <Label>Document Category</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="academic_record">Academic Record (Report Card/Transcript)</SelectItem>
                        <SelectItem value="attendance_log">Attendance Log</SelectItem>
                        <SelectItem value="iep_document">IEP / Special Needs</SelectItem>
                        <SelectItem value="lesson_plan">Lesson Plan / Curriculum</SelectItem>
                        <SelectItem value="clinical_note">Clinical / Referral Note</SelectItem>
                        <SelectItem value="admin_record">Administrative Record</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
            >
                <input {...getInputProps()} />
                {file ? (
                    <div className="flex flex-col items-center text-center">
                        <FileText className="h-10 w-10 text-primary mb-2" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center text-muted-foreground">
                        <Upload className="h-10 w-10 mb-2" />
                        <p className="font-medium">Drag & drop or click to upload</p>
                        <p className="text-xs mt-1">PDF, Excel, CSV, Images supported</p>
                    </div>
                )}
            </div>

            {progress > 0 && <Progress value={progress} className="h-2" />}

            <Button 
                onClick={handleUpload} 
                disabled={!file || !category || uploading} 
                className="w-full"
            >
                {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                    "Upload & Extract"
                )}
            </Button>
        </CardContent>
    </Card>
  );
}
