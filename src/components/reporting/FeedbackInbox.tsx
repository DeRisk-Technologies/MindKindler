import React from 'react';
import { DraftComment } from '../../types/feedback';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Check, X, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FeedbackInboxProps {
    comments: DraftComment[];
    onResolve: (id: string, action: 'accept' | 'reject') => void;
}

export function FeedbackInbox({ comments, onResolve }: FeedbackInboxProps) {
    
    // Sort: Pending first, then by date
    const sorted = [...comments].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                Feedback Inbox
                <Badge variant="secondary" className="rounded-full">
                    {comments.filter(c => c.status === 'pending').length} Pending
                </Badge>
            </h3>

            {sorted.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No feedback received yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map(comment => (
                        <Card key={comment.id} className={cn(
                            "p-4 border-l-4 transition-all",
                            comment.status === 'pending' ? "border-l-blue-500 shadow-sm" : 
                            comment.status === 'accepted' ? "border-l-green-500 opacity-75 bg-gray-50" : 
                            "border-l-red-500 opacity-60 bg-gray-50"
                        )}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {comment.targetSection}
                                        </Badge>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm">
                                        <p className="text-gray-900 font-medium">"{comment.commentText}"</p>
                                        <p className="text-gray-500 text-xs mt-1 italic border-l-2 pl-2">
                                            Ref: "...{comment.originalText.substring(0, 50)}..."
                                        </p>
                                    </div>

                                    {comment.status !== 'pending' && (
                                        <div className={cn(
                                            "text-xs font-bold uppercase tracking-wide mt-2 inline-block px-2 py-0.5 rounded",
                                            comment.status === 'accepted' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {comment.status}
                                        </div>
                                    )}
                                </div>

                                {comment.status === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <Button 
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                            title="Accept & Apply"
                                            onClick={() => onResolve(comment.id, 'accept')}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0"
                                            title="Reject"
                                            onClick={() => onResolve(comment.id, 'reject')}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
