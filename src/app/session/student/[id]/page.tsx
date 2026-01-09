// src/app/session/student/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Volume2, Smile, Frown, ThumbsUp, ThumbsDown, HelpCircle, AlertCircle } from 'lucide-react';

// Mock Data for MVP - In production, this comes from Firestore real-time listener
const MOCK_CAPTIONS = [
    { id: 1, text: "Welcome to our session today.", speaker: "Dr. Smith" },
    { id: 2, text: "I'd like to ask you about how school is going.", speaker: "Dr. Smith" }
];

interface ReactionCard {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    textToSpeak: string;
}

const REACTION_CARDS: ReactionCard[] = [
    { id: 'happy', label: 'Happy / Good', icon: Smile, color: 'bg-green-500 hover:bg-green-600', textToSpeak: "I am feeling happy." },
    { id: 'sad', label: 'Sad / Upset', icon: Frown, color: 'bg-blue-500 hover:bg-blue-600', textToSpeak: "I am feeling sad." },
    { id: 'yes', label: 'Yes / Agree', icon: ThumbsUp, color: 'bg-emerald-600 hover:bg-emerald-700', textToSpeak: "Yes." },
    { id: 'no', label: 'No / Disagree', icon: ThumbsDown, color: 'bg-red-500 hover:bg-red-600', textToSpeak: "No." },
    { id: 'confused', label: 'Confused', icon: HelpCircle, color: 'bg-amber-500 hover:bg-amber-600', textToSpeak: "I am confused." },
    { id: 'break', label: 'Need Break', icon: AlertCircle, color: 'bg-slate-600 hover:bg-slate-700', textToSpeak: "I need a break." },
];

export default function StudentSessionBridge({ params }: { params: Promise<{ id: string }> }) {
    const { toast } = useToast();
    const [captions, setCaptions] = useState(MOCK_CAPTIONS);
    const [activeCard, setActiveCard] = useState<string | null>(null);

    // Simulate incoming captions
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setCaptions(prev => [
                    ...prev.slice(-4), // Keep last 5
                    { id: Date.now(), text: "Listening...", speaker: "..." }
                ]);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleReaction = (card: ReactionCard) => {
        // 1. Visual Feedback
        setActiveCard(card.id);
        setTimeout(() => setActiveCard(null), 500);

        // 2. Audio Feedback (Local)
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(card.textToSpeak);
            window.speechSynthesis.speak(utterance);
        }

        // 3. Send Event (Mock)
        console.log(`[Event] student_reaction: ${card.id}`);
        toast({
            title: "Sent",
            description: `You said: ${card.label}`,
            duration: 1500,
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
            
            {/* Top Bar: Captions Area */}
            <div className="mb-6 flex-none">
                <Card className="p-6 bg-white shadow-lg border-2 border-slate-200 min-h-[150px] flex flex-col justify-end">
                    <h2 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                        <Volume2 className="w-4 h-4 mr-2" /> Live Captions
                    </h2>
                    <div className="space-y-2">
                        {captions.map((cap) => (
                            <div key={cap.id} className="text-xl md:text-2xl font-medium text-slate-800 animate-in fade-in slide-in-from-bottom-2">
                                <span className="text-slate-400 text-base mr-2">{cap.speaker}:</span>
                                {cap.text}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Main Grid: AAC Cards */}
            <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {REACTION_CARDS.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => handleReaction(card)}
                        aria-label={`Select ${card.label}`}
                        className={cn(
                            "relative flex flex-col items-center justify-center p-6 rounded-2xl shadow-md transition-all duration-200 active:scale-95 focus:ring-4 focus:ring-offset-2 focus:ring-slate-400 outline-none",
                            card.color,
                            activeCard === card.id ? "ring-4 ring-offset-2 ring-slate-900 scale-95" : "hover:brightness-110"
                        )}
                    >
                        <card.icon className="w-20 h-20 md:w-32 md:h-32 text-white mb-4 drop-shadow-md" strokeWidth={1.5} />
                        <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">{card.label}</span>
                    </button>
                ))}
            </div>

            {/* Footer: Status */}
            <div className="mt-6 text-center text-slate-400 text-sm">
                Connected to Session • Secure Mode • Voice & Touch Enabled
            </div>
        </div>
    );
}
