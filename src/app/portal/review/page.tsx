"use client";

import React, { useState, Suspense } from 'react';
import { PortalGuard } from '@/components/portal/PortalGuard';
import { DraftCommenter } from '@/components/portal/DraftCommenter';
import { DraftReport } from '@/types/report';
import { DraftComment } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

// Mock Report Data for Portal View
const MOCK_DRAFT: DraftReport = {
    id: 'draft-1',
    caseId: 'case-123',
    findings: [],
    narrativeSections: {
        background_history: "Alex was born at 39 weeks via planned C-section. Early milestones were met within normal limits, although mother reports walking was slightly delayed (18 months).\n\nHe currently lives with his mother and younger sister in Leeds.",
        special_educational_needs: "Alex presents with significant difficulties in phonological awareness. Standardized testing (CTOPP-2) indicates scores below the 1st percentile.",
        social_care_needs: "No current social care involvement.",
        outcomes: "By the end of KS2, Alex will be able to read 100 high-frequency words.",
        views_interests_aspirations: "Alex loves dinosaurs and Minecraft.",
        health_needs: "None reported.",
        special_educational_provision: "See Table."
    },
    provisionPlan: [],
    createdAt: '2025-01-01',
    generatedByAiModel: 'gemini-1.5'
};

function ReviewContent() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // In real app, this would POST to API
    const handleAddComment = (comment: any) => {
        console.log("New Comment Queued:", comment);
        // Optimistic UI update or Toast here
        alert("Feedback recorded. Thank you!");
    };

    const handleFinish = () => {
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Feedback Submitted</h2>
                    <p className="text-gray-600">
                        Thank you for your contribution. The Educational Psychologist has been notified and will review your comments shortly.
                    </p>
                    <p className="text-sm text-gray-400 mt-4">You can close this window now.</p>
                </div>
            </div>
        );
    }

    return (
        <PortalGuard>
            <div className="min-h-screen bg-gray-50 font-sans">
                {/* Header */}
                <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">M</div>
                             <span className="font-semibold text-gray-700">MindKindler Secure Review</span>
                        </div>
                        <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">
                            Submit & Finish
                        </Button>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Draft EHC Plan Review</h1>
                        <p className="text-lg text-gray-600">
                            Please review the draft below for accuracy. Your feedback is crucial.
                        </p>
                    </div>

                    <DraftCommenter 
                        draftReport={MOCK_DRAFT} 
                        onAddComment={handleAddComment} 
                    />
                </main>
            </div>
        </PortalGuard>
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <ReviewContent />
        </Suspense>
    );
}
