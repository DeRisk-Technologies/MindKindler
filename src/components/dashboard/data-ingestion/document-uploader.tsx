"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Search, User, Building, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DocumentCategory } from "@/types/schema";
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock storage upload
const uploadFileToStorage = async (file: File) => {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://storage.googleapis.com/mock-bucket/${file.name}`), 1500);
    });
};

export function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [targetType, setTargetType] = useState<"student" | "school" | "user">("student");
  const [targetSearch, setTargetSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  
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

  // Search Logic
  useEffect(() => {
      const delayDebounceFn = setTimeout(async () => {
          if (!targetSearch || selectedTarget) return;

          let q;
          if (targetType === 'student') {
             q = query(collection(db, 'students'), where('firstName', '>=', targetSearch), limit(5));
          } else if (targetType === 'school') {
             q = query(collection(db, 'schools'), where('name', '>=', targetSearch), limit(5));
          } else {
             q = query(collection(db, 'users'), where('displayName', '>=', targetSearch), limit(5));
          }

          try {
             const snap = await getDocs(q);
             setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch (e) {
             console.error(e);
          }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [targetSearch, targetType, selectedTarget]);


  const handleUpload = async () => {
      if (!file || !category || !selectedTarget) return;
      setUploading(true);
      setProgress(10);

      try {
          // 1. Upload Binary
          const url = await uploadFileToStorage(file);
          setProgress(50);

          // 2. Create Document Record
          await addDoc(collection(db, "documents"), {
              userId: auth.currentUser?.uid,
              targetId: selectedTarget.id,
              targetType,
              targetName: selectedTarget.firstName || selectedTarget.name || selectedTarget.displayName,
              fileName: file.name,
              fileUrl: url,
              fileType: file.type,
              category,
              uploadDate: new Date().toISOString(),
              status: 'uploading', // Cloud Function triggers here
              createdAt: serverTimestamp()
          });
          setProgress(100);
          
          toast({ title: "Upload Complete", description: "Document queued for processing." });
          // Reset
          setFile(null);
          setCategory("");
          setSelectedTarget(null);
          setTargetSearch("");
      } catch (e) {
          toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
      } finally {
          setUploading(false);
          setTimeout(() => setProgress(0), 2000);
      }
  };

  return (
    <Card className="w-full">
        <CardContent className="p-6 space-y-6">
            
            {/* 1. Target Selection */}
            <div className="space-y-3">
                <Label>Who is this document for?</Label>
                <RadioGroup defaultValue="student" value={targetType} onValueChange={(v: any) => { setTargetType(v); setSelectedTarget(null); setTargetSearch(""); }} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="r1" />
                        <Label htmlFor="r1">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="school" id="r2" />
                        <Label htmlFor="r2">School</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="r3" />
                        <Label htmlFor="r3">Staff/User</Label>
                    </div>
                </RadioGroup>

                {!selectedTarget ? (
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={`Search ${targetType}...`} 
                            className="pl-8"
                            value={targetSearch}
                            onChange={e => setTargetSearch(e.target.value)}
                        />
                        {searchResults.length > 0 && targetSearch && (
                            <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
                                {searchResults.map(res => (
                                    <div 
                                        key={res.id} 
                                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                                        onClick={() => { setSelectedTarget(res); setTargetSearch(""); }}
                                    >
                                        {res.firstName ? `${res.firstName} ${res.lastName}` : (res.name || res.displayName)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/30 border rounded-md">
                        <div className="flex items-center gap-2">
                            {targetType === 'student' && <User className="h-4 w-4 text-primary" />}
                            {targetType === 'school' && <Building className="h-4 w-4 text-primary" />}
                            {targetType === 'user' && <Briefcase className="h-4 w-4 text-primary" />}
                            <span className="font-medium text-sm">
                                {selectedTarget.firstName ? `${selectedTarget.firstName} ${selectedTarget.lastName}` : (selectedTarget.name || selectedTarget.displayName)}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTarget(null)}>Change</Button>
                    </div>
                )}
            </div>

            {/* 2. Category Selection */}
            <div className="space-y-2">
                <Label>Document Category</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select content type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="academic_record">Academic Record (Report Card/Transcript)</SelectItem>
                        <SelectItem value="attendance_log">Attendance Log</SelectItem>
                        <SelectItem value="iep_document">IEP / Special Needs Plan</SelectItem>
                        <SelectItem value="clinical_note">Clinical / Psychological Assessment</SelectItem>
                        <SelectItem value="admin_record">Administrative / Registration</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 3. File Drop */}
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
                disabled={!file || !category || !selectedTarget || uploading} 
                className="w-full"
            >
                {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting...</>
                ) : (
                    "Upload & Process"
                )}
            </Button>
        </CardContent>
    </Card>
  );
}
