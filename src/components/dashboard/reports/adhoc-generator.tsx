"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, FileText, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AdhocReportGenerator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [reportType, setReportType] = useState("clinical_summary");
  const [studentName, setStudentName] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
      if (!prompt || !studentName) return;
      
      setLoading(true);
      try {
          // 1. Create a draft placeholder
          const docRef = await addDoc(collection(db, "reports"), {
              title: `${reportType === 'clinical_summary' ? 'Clinical Summary' : 'Report'} for ${studentName}`,
              status: 'draft',
              type: reportType,
              createdAt: serverTimestamp(),
              generatedBy: 'ai_adhoc',
              content: "Generating..."
          });

          // 2. Call AI Function (Mock or Real)
          const functions = getFunctions();
          const generateReport = httpsCallable(functions, 'generateClinicalReport');
          
          const result = await generateReport({
              studentId: "adhoc", // or real ID if integrated
              studentName: studentName,
              prompt: prompt,
              type: reportType
          });

          toast({
              title: "Report Generated",
              description: "Your report has been created successfully."
          });
          setOpen(false);
      } catch (error) {
          console.error(error);
          toast({
              title: "Error",
              description: "Failed to generate report. Please try again.",
              variant: "destructive"
          });
      } finally {
          setLoading(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Report Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Adhoc Report Generator
          </DialogTitle>
          <DialogDescription>
            Use AI to quickly generate a structured report or summary based on your notes or requirements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Student
            </Label>
            <Input
              id="name"
              placeholder="Student Name"
              className="col-span-3"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="clinical_summary">Clinical Summary</SelectItem>
                    <SelectItem value="progress_note">Progress Note</SelectItem>
                    <SelectItem value="iep_draft">IEP Draft</SelectItem>
                    <SelectItem value="parent_letter">Parent Letter</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prompt">Instructions / Notes</Label>
            <Textarea
              id="prompt"
              placeholder="e.g. Summarize the last 3 sessions focusing on reading improvements. Mention that attention span is still an issue."
              className="h-32"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading || !prompt || !studentName}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
