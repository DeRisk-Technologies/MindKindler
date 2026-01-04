"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Plus, 
    Loader2, 
    Sparkles, 
    UserPlus, 
    AlertTriangle, 
    Paperclip, 
    ShieldCheck, 
    CalendarCheck,
    Search
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Schema-aligned types
interface AppointmentFormData {
    title: string;
    type: string;
    startAt: string;
    endAt: string;
    locationType: 'video' | 'in_person' | 'phone';
    platform?: 'teams' | 'zoom' | 'meet';
    description: string;
    linkedContextId?: string; // Case ID, Assessment ID
}

interface Participant {
    id: string;
    email: string;
    name: string;
    type: 'internal' | 'external';
}

const MOCK_INTERNAL_USERS = [
    { id: 'u1', name: 'Dr. Sarah Smith', email: 'sarah.smith@mindkindler.com' },
    { id: 'u2', name: 'Admin Office', email: 'admin@mindkindler.com' },
];

export function CreateAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // AI Natural Language Input
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Form State
  const [formData, setFormData] = useState<AppointmentFormData>({
      title: '',
      type: 'consultation',
      startAt: '',
      endAt: '',
      locationType: 'video',
      platform: 'teams',
      description: ''
  });

  // Participant State
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [overrideExternal, setOverrideExternal] = useState(false);

  // --- Handlers ---

  const handleAiProcessing = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessingAi(true);
    
    // Simulate AI parsing logic
    setTimeout(() => {
        setFormData(prev => ({
            ...prev,
            title: "Consultation regarding Case #123",
            startAt: "2023-11-20T10:00",
            endAt: "2023-11-20T11:00",
            description: "Discussing assessment results."
        }));
        
        // Simulate extracting participants
        if (aiPrompt.toLowerCase().includes('sarah')) {
             addParticipant(MOCK_INTERNAL_USERS[0]);
        }
        
        setIsProcessingAi(false);
        toast({ title: "AI Drafted", description: "Form pre-filled from your prompt." });
    }, 1500);
  };

  const handleAvailabilityCheck = () => {
      // Simulate backend check
      toast({ 
          title: "Availability Checked", 
          description: <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-green-500"/> All internal participants are free at this time.</div> 
      });
  };

  const addParticipant = (user: {id: string, name: string, email: string}) => {
      if (participants.find(p => p.id === user.id)) return;
      setParticipants([...participants, { ...user, type: 'internal' }]);
      setParticipantInput('');
  };

  const addExternalParticipant = () => {
      const email = participantInput.trim();
      if (!email || !email.includes('@')) return;
      
      const isInternal = email.endsWith('@mindkindler.com'); // Simple check
      
      setParticipants([...participants, { 
          id: email, 
          email: email, 
          name: email, 
          type: isInternal ? 'internal' : 'external' 
      }]);
      setParticipantInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setFiles(Array.from(e.target.files));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Guardian Check: External Participants + Attachments
        const hasExternal = participants.some(p => p.type === 'external');
        const hasAttachments = files.length > 0;

        if (hasExternal && hasAttachments && !overrideExternal) {
            throw new Error("GUARDIAN_BLOCK");
        }

        // Logic
        if (new Date(formData.startAt) >= new Date(formData.endAt)) {
            throw new Error("End time must be after start time");
        }

        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({ title: "Appointment Scheduled", description: `${formData.title} booked.` });
        setOpen(false);
        
        // Reset
        setFormData({ title: '', type: 'consultation', startAt: '', endAt: '', locationType: 'video', description: '' });
        setParticipants([]);
        setFiles([]);
        setOverrideExternal(false);
        setAiPrompt('');

    } catch (error: any) {
        if (error.message === 'GUARDIAN_BLOCK') {
            return; // UI handles this via the Warning Block below
        }
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  // Derived state for Guardian Warning
  const showGuardianWarning = files.length > 0 && participants.some(p => p.type === 'external') && !overrideExternal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
            <Plus className="h-4 w-4" /> Smart Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Schedule Session
            {isProcessingAi && <Loader2 className="h-4 w-4 animate-spin text-purple-600"/>}
          </DialogTitle>
          <DialogDescription>
            Use AI to find the best time or enter details manually.
          </DialogDescription>
        </DialogHeader>

        {/* AI Prompt Section */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
            <Label className="text-purple-700 flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" /> AI Scheduler
            </Label>
            <div className="flex gap-2">
                <Input 
                    placeholder="e.g. Meet with Sarah next Tuesday morning for Case 123 review..." 
                    className="bg-white"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiProcessing()}
                />
                <Button size="sm" variant="secondary" onClick={handleAiProcessing} disabled={!aiPrompt}>
                    Generate
                </Button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Main Details */}
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                    placeholder="Session Title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required 
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                 <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </div>

          {/* Time & Availability */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
                <Label>Start</Label>
                <Input 
                    type="datetime-local" 
                    value={formData.startAt}
                    onChange={(e) => setFormData({...formData, startAt: e.target.value})}
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label>End</Label>
                <div className="flex gap-2">
                    <Input 
                        type="datetime-local" 
                        value={formData.endAt}
                        onChange={(e) => setFormData({...formData, endAt: e.target.value})}
                        required 
                    />
                     <Button type="button" variant="ghost" size="icon" title="Check Availability" onClick={handleAvailabilityCheck}>
                        <CalendarCheck className="h-5 w-5 text-green-600" />
                    </Button>
                </div>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
             <Label>Participants</Label>
             <div className="flex gap-2">
                <Input 
                    placeholder="Search name or enter email..." 
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addExternalParticipant();
                        }
                    }}
                />
                <Button type="button" variant="outline" onClick={addExternalParticipant}>Add</Button>
             </div>
             
             {/* Participant Chips */}
             <div className="flex flex-wrap gap-2 mt-2">
                 {participants.map(p => (
                     <Badge key={p.id} variant={p.type === 'external' ? "destructive" : "secondary"} className="gap-1 pl-2">
                         {p.type === 'external' && <AlertTriangle className="h-3 w-3" />}
                         {p.name}
                         <button 
                            type="button"
                            className="ml-1 hover:text-red-800"
                            onClick={() => setParticipants(participants.filter(x => x.id !== p.id))}
                         >
                             ×
                         </button>
                     </Badge>
                 ))}
             </div>
             {participants.some(p => p.type === 'external') && (
                 <p className="text-xs text-amber-600 flex items-center gap-1">
                     <AlertTriangle className="h-3 w-3"/> External participants detected. Privacy rules apply.
                 </p>
             )}
          </div>

          {/* Location & Context */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Context (Optional)</Label>
                 <Select value={formData.linkedContextId} onValueChange={(v) => setFormData({...formData, linkedContextId: v})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Link to Case/Assessment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="case-123">Case: Leo M. (Dyslexia)</SelectItem>
                        <SelectItem value="assess-456">Assessment: WISC-V</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Platform</Label>
                 <Select value={formData.platform} onValueChange={(v) => setFormData({...formData, platform: v as any})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>

          {/* Attachments & Guardian */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
                <Input type="file" multiple onChange={handleFileUpload} className="cursor-pointer" />
            </div>
            {files.length > 0 && (
                <div className="text-xs text-muted-foreground">
                    {files.length} files selected
                </div>
            )}
          </div>

          {/* Guardian Warning Block */}
          {showGuardianWarning && (
              <div className="border border-red-200 bg-red-50 p-3 rounded-md">
                  <h5 className="text-red-800 font-bold flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4"/> Guardian Privacy Alert
                  </h5>
                  <p className="text-xs text-red-700 mt-1">
                      You are attempting to send files to external participants. This action will be audited.
                      Ensure no PII is included in unencrypted files.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="checkbox" 
                        id="override" 
                        checked={overrideExternal} 
                        onChange={(e) => setOverrideExternal(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="override" className="text-xs font-medium text-red-800">
                          I confirm these files are safe to share externally.
                      </label>
                  </div>
              </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Meeting agenda..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || (showGuardianWarning && !overrideExternal)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
