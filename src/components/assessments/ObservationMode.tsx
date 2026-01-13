// src/components/assessments/ObservationMode.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Save, RotateCcw, Maximize2, Minimize2, Plus, X, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getRegionalDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestoreCollection } from '@/hooks/use-firestore';

interface ObservationModeProps {
    studentId?: string; 
    studentName?: string;
}

// Mimics LiveCockpit Styling
const INITIAL_TILES = [
    { id: 'focus', label: 'On Task' },
    { id: 'disrupt', label: 'Verbal Outburst' },
    { id: 'motor', label: 'Motor Restlessness' },
    { id: 'social', label: 'Peer Interaction' }
];

export function ObservationMode({ studentId: initialStudentId, studentName: initialStudentName }: ObservationModeProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    // Context Selection State
    const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || "");
    const [selectedStudentName, setSelectedStudentName] = useState(initialStudentName || "");
    const [showContextDialog, setShowContextDialog] = useState(!initialStudentId); // Show if no student pre-selected

    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [customTiles, setCustomTiles] = useState<string[]>(INITIAL_TILES.map(t => t.label));
    const [newTileName, setNewTileName] = useState("");
    const [isAddingTile, setIsAddingTile] = useState(false);
    
    // Log of events (Timestamped) instead of just counters
    const [events, setEvents] = useState<{ label: string, time: number }[]>([]);
    const [fullScreen, setFullScreen] = useState(false);

    const { data: students } = useFirestoreCollection('students', 'firstName', 'asc');

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
        if (navigator.vibrate) navigator.vibrate(50);
        setEvents(prev => [...prev, { label, time: elapsed }]);
        toast({ title: "Logged", description: label, duration: 1000 });
    };

    const countFrequencies = (evs: any[]) => {
        const counts: Record<string, number> = {};
        evs.forEach(e => counts[e.label] = (counts[e.label] || 0) + 1);
        return counts;
    };

    const handleSave = async () => {
        if (events.length === 0 || !selectedStudentId) {
             if(!selectedStudentId) setShowContextDialog(true);
             return;
        }
        setIsActive(false);

        try {
            if (user) {
                const region = user.region || 'uk';
                const db = getRegionalDb(region);
                
                // Save to 'assessment_results' so it appears in the Evidence Sidebar and Reports
                await addDoc(collection(db, 'assessment_results'), {
                    tenantId: user.tenantId,
                    studentId: selectedStudentId,
                    templateId: 'observation_log', // Unique ID for finding later
                    category: 'Observation',
                    completedAt: new Date().toISOString(),
                    status: 'completed',
                    responses: {
                         durationSeconds: elapsed,
                         events: events, // Full Log
                         summary: countFrequencies(events) // Aggregate
                    },
                    totalScore: events.length, // Just a metric
                    metadata: {
                        observerId: user.uid,
                        device: 'mobile_web'
                    }
                });
                
                toast({
                    title: "Observation Saved",
                    description: `Synced to ${selectedStudentName}'s profile as Evidence.`
                });
                // Reset
                setEvents([]);
                setElapsed(0);
            }
        } catch (e) {
            console.error("Save Failed", e);
            toast({ title: "Save Failed", variant: "destructive" });
        }
    };

    const counts = countFrequencies(events);

    return (
        <div className={cn(
            "flex flex-col h-full bg-slate-50 transition-all duration-300",
            fullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "w-full min-h-[500px]"
        )}>
            {/* Context Selector Modal */}
            <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
                 <DialogContent>
                     <DialogHeader><DialogTitle>Select Student to Observe</DialogTitle></DialogHeader>
                     <div className="py-4">
                         <Select onValueChange={(val) => {
                             const s = students.find(st => st.id === val);
                             setSelectedStudentId(val);
                             setSelectedStudentName(s ? `${s.firstName} ${s.lastName}` : "Student");
                             setShowContextDialog(false);
                         }}>
                             <SelectTrigger><SelectValue placeholder="Choose Student..."/></SelectTrigger>
                             <SelectContent>
                                 {students.map(s => (
                                     <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                     </div>
                 </DialogContent>
            </Dialog>


            {/* Header / Controls */}
            <div className="flex-none bg-white p-4 border-b shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 cursor-pointer" onClick={() => setShowContextDialog(true)}>
                        <User className="h-5 w-5" />
                     </div>
                     <div>
                         <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide cursor-pointer hover:underline" onClick={() => setShowContextDialog(true)}>
                             {selectedStudentName ? `${selectedStudentName}` : 'Select Student'}
                         </h2>
                         <div className="text-2xl font-mono font-bold text-slate-900 leading-none mt-1">
                             {formatTime(elapsed)}
                         </div>
                     </div>
                </div>
                
                <div className="flex items-center gap-2">
                     {!isActive ? (
                        <Button onClick={() => setIsActive(true)} disabled={!selectedStudentId} size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm">
                            <Play className="mr-2 h-4 w-4" /> Rec
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
                    Save to Evidence Bank ({events.length})
                </Button>
            </div>
        </div>
    );
}
