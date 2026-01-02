// src/components/upload/DocumentUploader.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Loader2, FileText, CheckCircle, WifiOff } from "lucide-react";
import { UploadService } from "@/services/upload-service";
import { offlineQueue } from "@/services/offline-queue";

interface DocumentUploaderProps {
    tenantId: string;
    userId: string;
    onUploadComplete?: (docId: string) => void;
}

export function DocumentUploader({ tenantId, userId, onUploadComplete }: DocumentUploaderProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles?.length) setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        maxFiles: 1,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] } 
    });

    const handleUpload = async () => {
        if (!file || !category) return;
        setUploading(true);
        setProgress(10); 

        try {
            if (isOffline) {
                // Queue for Sync
                await offlineQueue.enqueue('uploadDocument', { 
                    tenantId, 
                    file, // File/Blob stored in IDB
                    metadata: { uploadedBy: userId, category } 
                });
                toast({ title: "Offline", description: "Upload queued. Will sync when online." });
            } else {
                // Direct Upload
                const docId = await UploadService.uploadFile(tenantId, file, {
                    uploadedBy: userId,
                    category
                });
                onUploadComplete?.(docId);
                toast({ title: "Success", description: "File uploaded and queued for AI." });
            }
            
            setProgress(100);
            setFile(null);
            setCategory("");
        } catch (e: any) {
            toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const openCamera = () => {
        cameraInputRef.current?.click();
    };

    return (
        <Card className="w-full">
            <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" /> 
                    {isOffline ? "Offline Capture" : "Quick Upload"}
                    {isOffline && <WifiOff className="h-4 w-4 text-orange-500" />}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="academic">Academic Report</SelectItem>
                            <SelectItem value="attendance">Attendance Log</SelectItem>
                            <SelectItem value="clinical">Clinical Note</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={openCamera} className="w-full">
                        <Camera className="mr-2 h-4 w-4" /> Scan
                    </Button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={cameraInputRef} 
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.length) setFile(e.target.files[0]);
                        }}
                    />
                </div>

                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px] ${
                        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
                    }`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <div className="text-center space-y-2">
                            <FileText className="h-10 w-10 text-indigo-600 mx-auto" />
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Drag file or tap to browse</p>
                        </div>
                    )}
                </div>

                {progress > 0 && <Progress value={progress} className="h-2" />}

                <Button onClick={handleUpload} disabled={!file || !category || uploading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {uploading ? 'Processing...' : (isOffline ? 'Queue Upload' : 'Upload Document')}
                </Button>
            </CardContent>
        </Card>
    );
}
