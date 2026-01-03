import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProvenanceMetadata } from '@/types/schema';
import { ShieldCheck, CloudLightning, FileText, User, HelpCircle } from 'lucide-react';

interface ProvenanceBadgeProps {
  metadata?: ProvenanceMetadata;
  onClick?: () => void;
}

export function ProvenanceBadge({ metadata, onClick }: ProvenanceBadgeProps) {
  if (!metadata) return null;

  const getIcon = () => {
    switch (metadata.source) {
      case 'manual': return <User className="h-3 w-3" />;
      case 'ocr': return <FileText className="h-3 w-3" />;
      case 'lms': return <CloudLightning className="h-3 w-3" />;
      case 'parent_portal': return <User className="h-3 w-3" />; // Distinguish parent later
      default: return <HelpCircle className="h-3 w-3" />;
    }
  };

  const getColor = () => {
    if (metadata.verified) return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
    if (metadata.confidence && metadata.confidence > 0.8) return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
    if (metadata.confidence && metadata.confidence > 0.5) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
    return 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={onClick}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider cursor-pointer border ${getColor()}`}
          >
            {metadata.verified && <ShieldCheck className="h-3 w-3 text-green-600" />}
            {!metadata.verified && getIcon()}
            <span>
                {metadata.verified ? 'Verified' : `${metadata.source} ${metadata.confidence ? Math.round(metadata.confidence * 100) + '%' : ''}`}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">Source: {metadata.source}</p>
            {metadata.verifiedBy && <p>Verified by: {metadata.verifiedBy}</p>}
            {metadata.verifiedAt && <p>Verified at: {new Date(metadata.verifiedAt).toLocaleDateString()}</p>}
            {!metadata.verified && <p className="text-orange-500">Unverified - click to review</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
