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
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Schema-aligned types
interface AppointmentFormData {
    title: string;
    type: string;
    startAt: string;
    endAt: string;
    locationType: 'video' | 'in_person' | 'phone';
    participants: string; // Comma separated for MVP
    description: string;
}

export function CreateAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<AppointmentFormData>({
      title: '',
      type: 'consultation',
      startAt: '',
      endAt: '',
      locationType: 'video',
      participants: '',
      description: ''
  });

  const handleChange = (field: keyof AppointmentFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Validation Logic
        if (new Date(formData.startAt) >= new Date(formData.endAt)) {
            throw new Error("End time must be after start time");
        }

        // Simulate API call to create Appointment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Creating Appointment:", formData);
        
        toast({ title: "Appointment Scheduled", description: `${formData.title} has been booked.` });
        setOpen(false);
        // Reset form
        setFormData({
            title: '',
            type: 'consultation',
            startAt: '',
            endAt: '',
            locationType: 'video',
            participants: '',
            description: ''
        });

    } catch (error: any) {
        toast({ 
            title: "Error", 
            description: error.message || "Failed to schedule appointment",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new session. Notifications will be sent to participants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Title & Type Row */}
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                    id="title" 
                    placeholder="e.g. Initial Consultation" 
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                 <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="telehealth">Telehealth</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="startAt">Start Time</Label>
                <Input 
                    id="startAt" 
                    type="datetime-local" 
                    value={formData.startAt}
                    onChange={(e) => handleChange('startAt', e.target.value)}
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="endAt">End Time</Label>
                <Input 
                    id="endAt" 
                    type="datetime-local" 
                    value={formData.endAt}
                    onChange={(e) => handleChange('endAt', e.target.value)}
                    required 
                />
            </div>
          </div>

          {/* Location & Participants */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                 <Select value={formData.locationType} onValueChange={(v) => handleChange('locationType', v as any)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="video">Video Call (Zoom/Teams)</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label htmlFor="participants">Participants (Emails)</Label>
                <Input 
                    id="participants" 
                    placeholder="parent@example.com, teacher@school.edu" 
                    value={formData.participants}
                    onChange={(e) => handleChange('participants', e.target.value)}
                />
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes / Agenda</Label>
            <Textarea 
                id="description" 
                placeholder="Brief details about this session..." 
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
