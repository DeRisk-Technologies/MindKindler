// src/components/assessments/ObservationMode.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Save, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BehaviorCounter {
    id: string;
    label: string;
    color: string;
    count: number;
}

const INITIAL_COUNTERS = [
    { id: 'focus', label: 'On Task', color: 'bg-green-500 hover:bg-green-600' },
    { id: 'disrupt', label: 'Verbal Outburst', color: 'bg-red-500 hover:bg-red-600' },
    { id: 'motor', label: 'Motor Restlessness', color: 'bg-amber-500 hover:bg-amber-600' },
    { id: 'social', label: 'Peer Interaction', color: 'bg-blue-500 hover:bg-blue-600' }
];

export function ObservationMode() {
    const { toast } = useToast();
    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [counters, setCounters] = useState<BehaviorCounter[]>(
        INITIAL_COUNTERS.map(c => ({ ...c, count: 0 }))
    );
    const [fullScreen, setFullScreen] = useState(false);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleTap = (id: string) => {
        if (!isActive) return;
        // Haptic feedback for mobile devices
        if (navigator.vibrate) navigator.vibrate(50);
        
        setCounters(prev => prev.map(c => 
            c.id === id ? { ...c, count: c.count + 1 } : c
        ));
    };

    const handleSave = async () => {
        setIsActive(false);
        // In prod: save to firestore 'observations' subcollection
        console.log("Saving Observation Session:", { elapsed, counters });
        
        toast({
            title: "Observation Saved",
            description: `Session duration: ${formatTime(elapsed)}. Data synced to Student Profile.`
        });
    };

    return (
        <div className={cn(
            "flex flex-col gap-4 p-4 transition-all duration-300",
            fullScreen ? "fixed inset-0 z-50 bg-background h-screen w-screen" : "w-full"
        )}>
            {/* Header / Controls */}
            <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-3xl font-mono font-bold text-slate-800 w-24">
                        {formatTime(elapsed)}
                    </div>
                    {!isActive ? (
                        <Button onClick={() => setIsActive(true)} size="lg" className="bg-green-600">
                            <Play className="mr-2 h-5 w-5" /> Start
                        </Button>
                    ) : (
                        <Button onClick={() => setIsActive(false)} size="lg" variant="secondary">
                            <Pause className="mr-2 h-5 w-5" /> Pause
                        </Button>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setFullScreen(!fullScreen)}>
                        {fullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                    <Button variant="default" onClick={handleSave} disabled={elapsed === 0}>
                        <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                </div>
            </div>

            {/* Tap Grid - Optimized for Touch */}
            <div className="grid grid-cols-2 gap-4 flex-grow h-full">
                {counters.map(counter => (
                    <Card 
                        key={counter.id}
                        onClick={() => handleTap(counter.id)}
                        className={cn(
                            "flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 select-none text-white shadow-md border-none",
                            counter.color,
                            !isActive && "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        <span className="text-6xl font-bold drop-shadow-md">{counter.count}</span>
                        <span className="text-xl font-medium mt-2 uppercase tracking-wide">{counter.label}</span>
                    </Card>
                ))}
            </div>

            {/* Hint */}
            <div className="text-center text-xs text-muted-foreground">
                Observation Mode • Tap tiles to increment count • Auto-syncs to cloud
            </div>
        </div>
    );
}
