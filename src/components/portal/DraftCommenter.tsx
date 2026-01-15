import React, { useState } from 'react';
import { DraftReport, ReportSectionName } from '../../types/report';
import { DraftComment } from '../../types/feedback';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { MessageSquarePlus, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

interface DraftCommenterProps {
    draftReport: DraftReport;
    onAddComment: (comment: Omit<DraftComment, 'id' | 'sessionId' | 'status' | 'createdAt'>) => void;
}

export function DraftCommenter({ draftReport, onAddComment }: DraftCommenterProps) {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [originalText, setOriginalText] = useState('');

    const sections: { key: ReportSectionName; label: string }[] = [
        { key: 'background_history', label: 'Background History' },
        { key: 'special_educational_needs', label: 'Special Educational Needs (Section B)' },
        { key: 'social_care_needs', label: 'Social Care Needs (Section D)' },
        { key: 'outcomes', label: 'Outcomes (Section E)' }
    ];

    const openCommentModal = (sectionKey: string, content: string) => {
        setActiveSection(sectionKey);
        setOriginalText(content.substring(0, 100) + '...'); // Just a snippet reference
        setCommentText('');
    };

    const submitComment = () => {
        if (!activeSection) return;
        
        onAddComment({
            targetSection: activeSection,
            originalText: originalText, // In real app, might select specific substring
            commentText: commentText,
            stakeholderEmail: 'parent@example.com' // Should come from context/session
        });

        setActiveSection(null);
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-24">
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mb-6">
                <h3 className="font-semibold text-blue-900">How to review this document</h3>
                <p className="text-sm text-blue-800 mt-1">
                    Please read through the sections below. If you see anything factually incorrect or missing, 
                    click the <strong>"Add Comment"</strong> button next to that section.
                </p>
            </div>

            {sections.map(({ key, label }) => {
                const content = draftReport.narrativeSections[key];
                if (!content) return null;

                return (
                    <Card key={key} className="overflow-hidden shadow-sm border-gray-200">
                        <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                                {label}
                            </h2>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2 bg-white text-blue-600 hover:bg-blue-50 border-blue-200"
                                onClick={() => openCommentModal(key, content)}
                            >
                                <MessageSquarePlus className="w-4 h-4" />
                                Add Comment
                            </Button>
                        </div>
                        
                        <div className="p-6 prose prose-blue max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                            {content}
                        </div>
                    </Card>
                );
            })}

            {/* Comment Modal */}
            <Dialog open={!!activeSection} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Feedback</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="bg-gray-50 p-3 rounded text-sm italic text-gray-600 border-l-2 border-gray-300">
                            "Ref: {originalText}"
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Your Comment / Correction</label>
                            <Textarea 
                                value={commentText} 
                                onChange={(e) => setCommentText(e.target.value)} 
                                placeholder="e.g. He actually started walking at 14 months, not 18..."
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActiveSection(null)}>Cancel</Button>
                        <Button onClick={submitComment} className="gap-2 bg-blue-600">
                            Submit Feedback <Send className="w-4 h-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
