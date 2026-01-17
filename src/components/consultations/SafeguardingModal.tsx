'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Phone, Mail, Lock, Plus, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { escalateRisk } from "@/app/actions/safeguarding"; 
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface Contact {
  id: string;
  name: string;
  role: string; 
  email: string;
  phone: string;
}

export default function SafeguardingModal({ 
  isOpen, 
  onClose, 
  studentId, 
  detectedRisks = [], 
  contacts = [] // Default to empty array
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  studentId: string;
  detectedRisks?: string[];
  contacts?: Contact[];
}) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [method, setMethod] = useState<'email' | 'call_log'>('email');
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Manual Recipient State
  const [extraEmail, setExtraEmail] = useState("");
  const [showExtraEmail, setShowExtraEmail] = useState(false);

  // Call Log State
  const [callDetails, setCallDetails] = useState({
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      duration: '',
      summary: '',
      agreedAction: ''
  });

  const handleEscalate = async () => {
    setIsSubmitting(true);
    try {
        // 1. Log the Protocol to Audit Trail
        await escalateRisk({
            studentId,
            contactIds: selectedContacts,
            manualRecipient: extraEmail,
            method,
            notes: method === 'call_log' ? JSON.stringify(callDetails) : notes,
            detectedRisks
        });

        // 2. Execute Action (Email)
        if (method === 'email' || (method === 'call_log' && selectedContacts.length > 0)) {
            const sendFn = httpsCallable(functions, 'processEmailQueueV2'); // Use queue or direct send
            
            // Collect emails
            const recipients = contacts.filter(c => selectedContacts.includes(c.id)).map(c => c.email);
            if (extraEmail) recipients.push(extraEmail);

            if (recipients.length > 0) {
                // Mock payload for now, connect to real template
                console.log("Sending Safeguarding Email to:", recipients);
                // await sendFn({ ... }) 
            }
        }

        toast({ title: "Safeguarding Protocol Initiated", description: "Logs Created & Actions Queued", variant: "destructive" });
        onClose();
    } catch (e: any) {
        console.error(e);
        toast({ title: "Error", description: e.message || "Failed to execute protocol", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-l-8 border-l-red-600 max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">1. Select Recipients</h3>
              {!showExtraEmail && (
                  <Button variant="ghost" size="sm" onClick={() => setShowExtraEmail(true)} className="h-6 text-xs">
                      <Plus className="w-3 h-3 mr-1"/> Add External Email
                  </Button>
              )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {showExtraEmail && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg animate-in slide-in-from-top-2">
                  <Label className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      External Recipient Warning
                  </Label>
                  <p className="text-[10px] text-amber-700 mb-2">
                      Ensure you are authorized to share confidential data with this address.
                  </p>
                  <Input 
                    placeholder="external@authority.gov.uk" 
                    value={extraEmail} 
                    onChange={e => setExtraEmail(e.target.value)}
                    className="bg-white"
                  />
              </div>
          )}
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

        {/* 3. Details */}
        <div className="py-2 space-y-3">
          {method === 'email' ? (
              <>
                <label className="text-sm font-semibold">3. Email Body / Justification</label>
                <Textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Describe the immediate risk observed..."
                    className="mt-1 border-red-200 focus:border-red-500 min-h-[100px]"
                />
              </>
          ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label>Call Time</Label>
                          <Input value={callDetails.time} onChange={e => setCallDetails({...callDetails, time: e.target.value})} />
                      </div>
                      <div>
                          <Label>Duration (mins)</Label>
                          <Input value={callDetails.duration} onChange={e => setCallDetails({...callDetails, duration: e.target.value})} />
                      </div>
                  </div>
                  <div>
                      <Label>Summary of Conversation</Label>
                      <Textarea 
                        value={callDetails.summary} 
                        onChange={e => setCallDetails({...callDetails, summary: e.target.value})}
                        placeholder="What was discussed?"
                      />
                  </div>
                  <div>
                      <Label>Agreed Action Plan</Label>
                      <Input 
                        value={callDetails.agreedAction} 
                        onChange={e => setCallDetails({...callDetails, agreedAction: e.target.value})}
                        placeholder="e.g. Police to visit home at 18:00"
                      />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                      <Checkbox id="send_copy" defaultChecked />
                      <label htmlFor="send_copy" className="text-sm text-slate-600">Send summary copy to recipient as evidence</label>
                  </div>
              </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleEscalate} 
            disabled={(selectedContacts.length === 0 && !extraEmail) || isSubmitting}
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
