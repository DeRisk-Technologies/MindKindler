// src/components/student360/ProvenanceBadge.tsx

"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { ProvenanceMetadata } from "@/types/schema";
import { CheckCircle, AlertTriangle, FileSearch, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { Student360Service } from '@/services/student360-service';
import { useAuth } from '@/hooks/use-auth';

interface ProvenanceBadgeProps {
  metadata?: ProvenanceMetadata;
  studentId?: string; // Needed for update
  fieldPath?: string; // Needed for update (e.g., "identity.firstName")
  onVerify?: () => void; // Callback to refresh parent
}

export function ProvenanceBadge({ metadata, studentId, fieldPath, onVerify }: ProvenanceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { shardId } = usePermissions();

  if (!metadata) return null;

  const handleVerify = async () => {
      if (!studentId || !fieldPath || !user) return;
      setIsVerifying(true);
      try {
          await Student360Service.verifyField(
              studentId, 
              fieldPath, 
              user.uid, 
              'manual-review', 
              shardId || 'default'
          );
          
          toast({ title: "Verified", description: "Field marked as verified." });
          setIsOpen(false);
          if (onVerify) onVerify();
      } catch (err: any) {
          toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
          setIsVerifying(false);
      }
  };

  const getBadgeContent = () => {
    if (metadata.verified) {
      return (
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 gap-1 pl-1">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    
    // Interactive Badge for Unverified
    return (
      <Badge 
        variant="outline" 
        className="text-orange-700 bg-orange-50 border-orange-200 gap-1 pl-1 cursor-pointer hover:bg-orange-100"
        onClick={() => setIsOpen(true)}
      >
        <AlertTriangle className="h-3 w-3" />
        {metadata.source?.toUpperCase() || 'MANUAL'}
      </Badge>
    );
  };

  return (
    <>
      {getBadgeContent()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Data Source</DialogTitle>
            <DialogDescription>
              This data was entered manually. Please confirm you have sighted evidence (e.g. Birth Certificate, Passport).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             <div className="p-3 bg-slate-50 rounded border text-sm">
                 <p><strong>Source:</strong> {metadata.source}</p>
                 <p><strong>Confidence:</strong> {metadata.confidence ? `${metadata.confidence * 100}%` : 'N/A'}</p>
             </div>
             
             <div className="space-y-2">
                 <label className="text-sm font-medium">Verification Note</label>
                 <Textarea placeholder="e.g. Sighted original Birth Certificate #123456" />
             </div>
          </div>

          <DialogFooter>
             <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
             <Button onClick={handleVerify} disabled={isVerifying} className="bg-green-600 hover:bg-green-700">
                 {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                 <ShieldCheck className="mr-2 h-4 w-4"/> Confirm Verified
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
