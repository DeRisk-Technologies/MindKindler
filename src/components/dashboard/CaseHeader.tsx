import React from 'react';
import { CaseFile } from '../../types/case';
import { AlertTriangle, ShieldAlert, Baby, Building2, Hash } from 'lucide-react';
import { Button } from '../../components/ui/button'; 
import { Badge } from '../../components/ui/badge';   

interface CaseHeaderProps {
    caseFile: CaseFile;
    onEscalate?: () => void;
}

export function CaseHeader({ caseFile, onEscalate }: CaseHeaderProps) {
    // Determine risk flags for badging (Safely handle undefined)
    const flags = caseFile.flags || {};

    return (
        <div className="bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Left: Student Identity */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {caseFile.studentName}
                    </h1>
                    {/* Status Badge */}
                    <Badge variant="outline" className="uppercase text-xs font-semibold tracking-wide">
                        {caseFile.status}
                    </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center gap-1">
                        <Baby className="w-4 h-4" />
                        <span>DOB: {caseFile.dob ? new Date(caseFile.dob).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    {caseFile.upn && (
                        <div className="flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            <span>UPN: {caseFile.upn}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{caseFile.localAuthorityId}</span>
                    </div>
                </div>

                {/* Risk Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {flags.safeguardingRisk && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Safeguarding Risk
                        </Badge>
                    )}
                    {flags.hasSocialWorker && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Social Worker Involved
                        </Badge>
                    )}
                    {flags.isNonVerbal && (
                        <Badge variant="secondary" className="gap-1">
                            Non-Verbal Protocol
                        </Badge>
                    )}
                     {flags.requiresGuardianPresence && (
                        <Badge variant="secondary" className="gap-1">
                            2-Person Visit Req.
                        </Badge>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2 shadow-sm"
                    onClick={onEscalate}
                >
                    <ShieldAlert className="w-4 h-4" />
                    Report Urgent Risk
                </Button>
            </div>
        </div>
    );
}
