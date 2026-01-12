// src/components/assessments/ObservationMode.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Save, RotateCcw, Maximize2, Minimize2, Plus, X, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getRegionalDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

interface ObservationModeProps {
    studentId?: string; // Optional context linking
    studentName?: string;
}

// Mimics LiveCockpit Styling
const INITIAL_TILES = [
    { id: 'focus', label: 'On Task' },
    { id: 'disrupt', label: 'Verbal Outburst' },
    { id: 'motor', label: 'Motor Restlessness' },
    { id: 'social', label: 'Peer Interaction' }
];

export function ObservationMode({ studentId, studentName }: ObservationModeProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [customTiles, setCustomTiles] = useState<string[]>(INITIAL_TILES.map(t => t.label));
    const [newTileName, setNewTileName] = useState("");
    const [isAddingTile, setIsAddingTile] = useState(false);
    
    // Log of events (Timestamped) instead of just counters
    const [events, setEvents] = useState<{ label: string, time: number }[]>([]);
    
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

    const addTile = () => {
        if (newTileName.trim()) {
            setCustomTiles([...customTiles, newTileName]);
            setNewTileName("");
            setIsAddingTile(false);
        }
    };

    const handleTap = (label: string) => {
        if (!isActive) return;
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Log Event
        setEvents(prev => [...prev, { label, time: elapsed }]);
        
        // Optimistic Toast (Short)
        toast({ title: "Logged", description: label, duration: 1000 });
    };

    const handleSave = async () => {
        if (events.length === 0) return;
        setIsActive(false);

        // Save to Firestore
        try {
            if (studentId && user) {
                const region = user.region || 'uk';
                const db = getRegionalDb(region);
                
                // Save as a structured observation report or raw events
                // We'll save to 'cases' or 'observations' subcollection
                // For now, let's create a 'case' note or 'observation_session'
                // Assuming 'observations' collection exists or subcollection
                // We'll use a root collection 'observations' linked to student
                
                await addDoc(collection(db, 'observations'), {
                    tenantId: user.tenantId,
                    studentId,
                    observerId: user.uid,
                    date: new Date().toISOString(),
                    durationSeconds: elapsed,
                    events: events,
                    summary: countFrequencies(events),
                    type: 'mobile_observation'
                });
                
                toast({
                    title: "Observation Saved",
                    description: `Synced to ${studentName || 'Student Profile'}.`
                });
            } else {
                 console.log("Offline/Demo Save:", { elapsed, events });
                 toast({ title: "Demo Save", description: "See console for data." });
            }
        } catch (e) {
            console.error("Save Failed", e);
            toast({ title: "Save Failed", variant: "destructive" });
        }
    };

    const countFrequencies = (evs: any[]) => {
        const counts: Record<string, number> = {};
        evs.forEach(e => counts[e.label] = (counts[e.label] || 0) + 1);
        return counts;
    };

    const counts = countFrequencies(events);

    return (
        <div className={cn(
            "flex flex-col h-full bg-slate-50 transition-all duration-300",
            fullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "w-full min-h-[500px]"
        )}>
            {/* Header / Controls */}
            <div className="flex-none bg-white p-4 border-b shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                        <Activity className="h-5 w-5" />
                     </div>
                     <div>
                         <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                             {studentName ? `Observing: ${studentName}` : 'Observation Mode'}
                         </h2>
                         <div className="text-2xl font-mono font-bold text-slate-900 leading-none mt-1">
                             {formatTime(elapsed)}
                         </div>
                     </div>
                </div>
                
                <div className="flex items-center gap-2">
                     {!isActive ? (
                        <Button onClick={() => setIsActive(true)} size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm">
                            <Play className="mr-2 h-4 w-4" /> Start
                        </Button>
                    ) : (
                        <Button onClick={() => setIsActive(false)} size="sm" variant="secondary" className="animate-pulse">
                            <Pause className="mr-2 h-4 w-4" /> Pause
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setFullScreen(!fullScreen)}>
                        {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Dynamic Grid (Matches LiveCockpit) */}
            <div className="flex-grow p-4 overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Behaviors</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-slate-200 rounded-full"
                        onClick={() => setIsAddingTile(!isAddingTile)}
                    >
                        {isAddingTile ? <X className="w-4 h-4 text-slate-500"/> : <Plus className="w-4 h-4 text-indigo-600"/>}
                    </Button>
                </div>

                {/* Add Tile Input */}
                {isAddingTile && (
                    <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                        <Input 
                            className="h-9 text-sm" 
                            placeholder="Label (e.g. 'Stimming')" 
                            value={newTileName}
                            onChange={(e) => setNewTileName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTile()}
                            autoFocus
                        />
                        <Button size="sm" className="bg-indigo-600" onClick={addTile}>Add</Button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {customTiles.map((tile, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleTap(tile)}
                            disabled={!isActive}
                            className={cn(
                                "relative group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all active:scale-95",
                                isActive ? "hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/50" : "opacity-60 grayscale cursor-not-allowed"
                            )}
                        >
                            <div className={cn(
                                "h-3 w-3 rounded-full mb-3 transition-colors",
                                isActive ? "bg-slate-300 group-hover:bg-indigo-500" : "bg-slate-200"
                            )} />
                            <span className="text-sm font-bold text-slate-700 text-center leading-tight group-hover:text-indigo-900">
                                {tile}
                            </span>
                            
                            {/* Counter Badge */}
                            {counts[tile] > 0 && (
                                <Badge className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200">
                                    {counts[tile]}
                                </Badge>
                            )}

                            {/* Delete Hover (Only if active and count is 0 to prevent accidental data loss? Or just allow) */}
                            {isActive && (
                                <div 
                                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomTiles(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                >
                                    <X className="w-3 h-3 text-red-400" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / Save */}
            <div className="p-4 border-t bg-white">
                <Button 
                    variant="default" 
                    className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md"
                    onClick={handleSave} 
                    disabled={events.length === 0}
                >
                    <Save className="mr-2 h-5 w-5" /> 
                    Save Session ({events.length} Events)
                </Button>
            </div>
        </div>
    );
}
