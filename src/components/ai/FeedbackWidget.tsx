// src/components/ai/FeedbackWidget.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { FeedbackService } from "@/services/feedback-service";
import { useToast } from "@/hooks/use-toast";

interface FeedbackWidgetProps {
    traceId: string; // The provenance ID of the AI generation
    feature: string;
    tenantId: string;
    userId: string;
    className?: string;
}

export function FeedbackWidget({ traceId, feature, tenantId, userId, className }: FeedbackWidgetProps) {
    const { toast } = useToast();
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [comment, setComment] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleRate = async (val: 'positive' | 'negative') => {
        setRating(val);
        setIsOpen(true); // Open comment box

        // Optimistic submit
        await FeedbackService.submitFeedback({
            tenantId,
            userId,
            traceId,
            feature,
            rating: val
        });
        
        if (val === 'positive') {
             toast({ description: "Thanks for your feedback!" });
        }
    };

    const handleCommentSubmit = async () => {
        if (!rating) return;
        await FeedbackService.submitFeedback({
            tenantId,
            userId,
            traceId,
            feature,
            rating,
            comment,
            reason: rating === 'negative' ? 'style' : undefined // Simplified
        });
        setIsOpen(false);
        toast({ description: "Detailed feedback saved." });
    };

    if (rating === 'positive' && !isOpen) {
        return <Button variant="ghost" size="sm" disabled className="text-green-600"><Check className="mr-1 h-3 w-3"/> Helpful</Button>;
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <Button 
                variant={rating === 'positive' ? "secondary" : "ghost"} 
                size="sm" 
                className="h-6 px-2"
                onClick={() => handleRate('positive')}
            >
                <ThumbsUp className="h-3 w-3" />
            </Button>
            
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        variant={rating === 'negative' ? "secondary" : "ghost"} 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => handleRate('negative')}
                    >
                        <ThumbsDown className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                    <p className="text-xs font-medium mb-2">How can we improve?</p>
                    <Textarea 
                        placeholder="e.g. Too verbose, missed context..." 
                        className="h-16 text-xs mb-2"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-6 text-xs">Skip</Button>
                        <Button size="sm" onClick={handleCommentSubmit} className="h-6 text-xs">Send</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
