// src/components/ui/verification-badge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
    status?: 'unverified' | 'pending' | 'verified' | 'rejected';
    hcpcNumber?: string;
}

export function VerificationBadge({ status = 'unverified', hcpcNumber }: Props) {
    if (status === 'verified') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 cursor-default">
                            <ShieldCheck className="h-3 w-3" /> 
                            HCPC Verified
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Practitioner identity verified against HCPC Register.</p>
                        {hcpcNumber && <p className="text-xs mt-1 font-mono">Reg: {hcpcNumber}</p>}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (status === 'pending') {
        return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pending Verification
            </Badge>
        );
    }

    if (status === 'rejected') {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Unverified
            </Badge>
        );
    }

    return null; // Don't show anything for unverified/default to reduce noise, or show grey badge
}
