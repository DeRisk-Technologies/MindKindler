'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Phone, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { escalateRisk } from "@/app/actions/safeguarding"; // Server Action (see Phase 4)

interface Contact {
  id: string;
  name: string;
  role: string; // 'SENCO', 'Parent', etc.
  email: string;
  phone: string;
}

export default function SafeguardingModal({ 
  isOpen, 
  onClose, 
  studentId, 
  detectedRisks = [], 
  contacts 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  studentId: string;
  detectedRisks?: string[];
  contacts: Contact[];
}) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [method, setMethod] = useState<'email' | 'call_log'>('email');
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEscalate = async () => {
    setIsSubmitting(true);
    try {
      await escalateRisk({
        studentId,
        contactIds: selectedContacts,
        method,
        notes,
        detectedRisks
      });
      toast({ title: "Safeguarding Protocol Initiated", description: "Logs Created", variant: "destructive" });
      onClose();
    } catch (e) {
        toast({ title: "Error", description: "Failed to execute protocol", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-l-8 border-l-red-600 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
            <AlertTriangle className="h-6 w-6" />
            CRITICAL SAFEGUARDING PROTOCOL
          </DialogTitle>
          <div className="bg-red-50 p-3 rounded text-red-800 text-sm mt-2">
            You are initiating a formal safeguarding escalation. This action will be 
            permanently logged in the legal audit trail.
          </div>
        </DialogHeader>

        {/* Risk Context */}
        {detectedRisks.length > 0 && (
          <div className="mb-4">
            <label className="text-sm font-semibold">Detected Triggers:</label>
            <div className="flex gap-2 mt-1">
              {detectedRisks.map(r => (
                <span key={r} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 1. Who to Contact? */}
        <div className="space-y-3 py-2">
          <h3 className="font-semibold text-gray-900">1. Select Recipients</h3>
          <div className="grid grid-cols-2 gap-3">
            {contacts.map(contact => (
              <div key={contact.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedContacts.includes(contact.id) ? 'border-red-500 bg-red-50' : 'hover:border-gray-300'}`}>
                <Checkbox 
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={(checked) => {
                    if(checked) setSelectedContacts([...selectedContacts, contact.id]);
                    else setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                  }}
                />
                <div>
                  <div className="font-bold text-sm">{contact.name} ({contact.role})</div>
                  <div className="text-xs text-gray-500">{contact.email}</div>
                  <div className="text-xs text-gray-500">{contact.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Action Method */}
        <div className="space-y-3 py-2">
          <h3 className="font-semibold text-gray-900">2. Action Required</h3>
          <div className="flex gap-4">
            <Button 
              variant={method === 'email' ? 'destructive' : 'outline'} 
              className="flex-1 h-20 flex flex-col gap-1"
              onClick={() => setMethod('email')}
            >
              <Mail className="h-6 w-6" />
              <span>Send Evidence Email</span>
              <span className="text-[10px] opacity-80">(Auto-generated template)</span>
            </Button>
            <Button 
              variant={method === 'call_log' ? 'destructive' : 'outline'}
              className="flex-1 h-20 flex flex-col gap-1"
              onClick={() => setMethod('call_log')}
            >
              <Phone className="h-6 w-6" />
              <span>Log Emergency Call</span>
              <span className="text-[10px] opacity-80">(Record manual call details)</span>
            </Button>
          </div>
        </div>

        {/* 3. Clinical Note */}
        <div className="py-2">
          <label className="text-sm font-semibold">3. Clinical Justification / Notes</label>
          <Textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder="Describe the immediate risk observed..."
            className="mt-1 border-red-200 focus:border-red-500"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleEscalate} 
            disabled={selectedContacts.length === 0 || isSubmitting}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            {isSubmitting ? 'Executing Protocol...' : 'CONFIRM ESCALATION'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
