"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Search, User, Building, Briefcase, ChevronsUpDown, Check, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DocumentCategory } from "@/types/schema";
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db, auth, getRegionalDb } from "@/lib/firebase"; // Ensure regional support
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock storage upload
const uploadFileToStorage = async (file: File) => {
    return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://storage.googleapis.com/mock-bucket/${file.name}`), 1500);
    });
};

interface DocumentUploaderProps {
    preselectedStudentId?: string;
    locked?: boolean;
}

export function DocumentUploader({ preselectedStudentId, locked }: DocumentUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [targetType, setTargetType] = useState<"student" | "school" | "user">("student");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Load Preselected Student
  useEffect(() => {
      if (preselectedStudentId && user) {
          async function loadStudent() {
              try {
                  const region = user?.region || 'uk';
                  const db = getRegionalDb(region);
                  const docRef = doc(db, 'students', preselectedStudentId);
                  const snap = await getDoc(docRef);
                  if (snap.exists()) {
                      const data = snap.data();
                      setSelectedTarget({ id: snap.id, ...data });
                      setTargetType('student');
                  }
              } catch (e) {
                  console.error("Failed to load preselected student", e);
              }
          }
          loadStudent();
      }
  }, [preselectedStudentId, user]);

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

  // Search Logic (Only if not locked)
  useEffect(() => {
      if (locked && preselectedStudentId) return; // Skip search if locked

      const fetchResults = async () => {
          if (!searchValue) {
              setSearchResults([]);
              return;
          }

          let q;
          const targetDb = getRegionalDb(user?.region || 'uk'); // Use regional DB

          if (targetType === 'student') {
             q = query(collection(targetDb, 'students'), where('firstName', '>=', searchValue), limit(5));
          } else if (targetType === 'school') {
             q = query(collection(targetDb, 'schools'), where('name', '>=', searchValue), limit(5));
          } else {
             q = query(collection(targetDb, 'users'), where('displayName', '>=', searchValue), limit(5));
          }

          try {
             const snap = await getDocs(q);
             setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch (e) {
             console.error(e);
          }
      };

      const timer = setTimeout(fetchResults, 300);
      return () => clearTimeout(timer);
  }, [searchValue, targetType, locked, preselectedStudentId, user]);


  const handleUpload = async () => {
      if (!file || !category || !selectedTarget) return;
      setUploading(true);
      setProgress(10);

      try {
          const url = await uploadFileToStorage(file);
          setProgress(50);

          const targetDb = getRegionalDb(user?.region || 'uk');

          await addDoc(collection(targetDb, "documents"), { // Write to regional DB
              userId: user?.uid,
              targetId: selectedTarget.id,
              targetType,
              targetName: selectedTarget.firstName ? `${selectedTarget.firstName} ${selectedTarget.lastName}` : (selectedTarget.name || selectedTarget.displayName),
              fileName: file.name,
              fileUrl: url,
              fileType: file.type,
              category,
              uploadDate: new Date().toISOString(),
              status: 'uploading',
              tenantId: user?.tenantId || 'default', // Add tenantId
              createdAt: serverTimestamp()
          });
          setProgress(100);
          
          toast({ title: "Upload Complete", description: "Document queued for processing." });
          
          if (!locked) {
              setFile(null);
              setCategory("");
              setSelectedTarget(null);
              setSearchValue("");
          } else {
              setFile(null); // Keep target if locked
              setCategory("");
          }

      } catch (e) {
          toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
      } finally {
          setUploading(false);
          setTimeout(() => setProgress(0), 2000);
      }
  };

  const getDisplayName = (item: any) => {
      if (!item) return "";
      return item.firstName ? `${item.firstName} ${item.lastName}` : (item.name || item.displayName);
  };

  return (
    <Card className="w-full">
        <CardContent className="p-6 space-y-6">
            
            {/* 1. Target Selection */}
            <div className="space-y-3">
                <Label>Who is this document for?</Label>
                
                {locked && selectedTarget ? (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-md text-sm text-slate-700">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Locked to:</span>
                        <User className="w-4 h-4 text-indigo-500" />
                        {getDisplayName(selectedTarget)}
                    </div>
                ) : (
                    <>
                        <RadioGroup defaultValue="student" value={targetType} onValueChange={(v: any) => { setTargetType(v); setSelectedTarget(null); setSearchValue(""); }} className="flex gap-4">
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

                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between"
                            >
                            {selectedTarget ? getDisplayName(selectedTarget) : `Select ${targetType}...`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command shouldFilter={false}> 
                            <CommandInput placeholder={`Search ${targetType}...`} value={searchValue} onValueChange={setSearchValue} />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                {searchResults.map((item) => (
                                    <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={() => {
                                        setSelectedTarget(item);
                                        setOpenCombobox(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTarget?.id === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {getDisplayName(item)}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                    </>
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
                        <SelectItem value="evidence">Evidence / Report</SelectItem>
                        <SelectItem value="academic_record">Academic Record</SelectItem>
                        <SelectItem value="medical_report">Medical Report</SelectItem>
                        <SelectItem value="parental_advice">Parental Advice (Section A)</SelectItem>
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
