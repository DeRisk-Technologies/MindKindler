// src/components/ai/FeedbackWidget.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Check, AlertTriangle } from "lucide-react";
import { FeedbackService } from "@/services/feedback-service";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [reason, setReason] = useState<string>("other");
    const [comment, setComment] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRate = async (val: 'positive' | 'negative') => {
        setRating(val);
        
        if (val === 'negative') {
            setIsOpen(true); // Open detailed form
        } else {
            // Instant submit for positive
            await FeedbackService.submitFeedback({
                tenantId,
                userId,
                traceId,
                feature,
                rating: val
            });
            setIsSubmitted(true);
            toast({ description: "Thanks for your feedback!" });
        }
    };

    const handleDetailedSubmit = async () => {
        if (!rating) return;
        
        await FeedbackService.submitFeedback({
            tenantId,
            userId,
            traceId,
            feature,
            rating,
            comment,
            reason: reason as any
        });
        
        setIsOpen(false);
        setIsSubmitted(true);
        toast({ description: "Feedback report submitted." });
    };

    if (isSubmitted) {
        return (
            <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
                <Check className="h-3 w-3 text-green-500" />
                <span>Thanks</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <span className="text-[10px] text-muted-foreground mr-1 uppercase font-semibold tracking-wider">Rate AI</span>
            
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 hover:text-green-600 hover:bg-green-50"
                onClick={() => handleRate('positive')}
            >
                <ThumbsUp className="h-3 w-3" />
            </Button>
            
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRate('negative')}
                    >
                        <ThumbsDown className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 bg-white border shadow-lg" align="end">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Report Issue</span>
                    </div>
                    
                    <div className="space-y-3">
                        <Select onValueChange={setReason} defaultValue="other">
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select Reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hallucination">Hallucination (Factually Wrong)</SelectItem>
                                <SelectItem value="missed_fact">Missed Context / Document</SelectItem>
                                <SelectItem value="style">Tone / Style Issue</SelectItem>
                                <SelectItem value="unsafe">Unsafe / Harmful Content</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        <Textarea 
                            placeholder="Help us improve (optional)..." 
                            className="h-16 text-xs resize-none"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 text-xs">Cancel</Button>
                            <Button size="sm" onClick={handleDetailedSubmit} className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
