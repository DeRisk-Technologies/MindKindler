// src/components/consultations/LiveCockpit.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ChevronLeft, BrainCircuit, Play, CheckCircle2, 
    Plus, Mic, Square, Edit3, X, HelpCircle, Wifi, WifiOff, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/use-network-status'; // Phase 25 Hook
import { SyncEngine } from '@/services/sync-engine'; // Phase 25 Engine

import METHODS from '@/marketplace/catalog/uk_consultation_methods.json';

interface LiveCockpitProps {
    sessionId: string;
    initialMethodId?: string;
    onStageChange?: (stageId: string) => void;
    onObservation?: (label: string) => void;
}

export function LiveCockpit({ sessionId, initialMethodId = "path_process", onStageChange, onObservation }: LiveCockpitProps) {
    const { toast } = useToast();
    const isOnline = useNetworkStatus();
    
    // Process State
    const [activeMethod, setActiveMethod] = useState(METHODS.find(m => m.id === initialMethodId) || METHODS[0]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    
    // Observation State
    const [customTiles, setCustomTiles] = useState<string[]>(["Anxious Fidgeting", "Eye Contact", "Verbal Fluency"]);
    const [newTileName, setNewTileName] = useState("");
    const [isAddingTile, setIsAddingTile] = useState(false);

    // Sync State
    const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

    const currentStage = activeMethod.stages[currentStageIndex];
    const progress = ((currentStageIndex + 1) / activeMethod.stages.length) * 100;

    // --- Network Monitor ---
    useEffect(() => {
        setSyncStatus(isOnline ? 'synced' : 'offline');
        if (isOnline && syncStatus === 'offline') {
            // Trigger flush
            setSyncStatus('saving');
            SyncEngine.flushOutbox('uk', sessionId).then(() => setSyncStatus('synced'));
        }
    }, [isOnline]);

    // --- Process Navigation ---
    const handleNextStage = () => {
        if (currentStageIndex < activeMethod.stages.length - 1) {
            const nextIdx = currentStageIndex + 1;
            setCurrentStageIndex(nextIdx);
            onStageChange?.(activeMethod.stages[nextIdx].id);
        } else {
            toast({ title: "Process Complete", description: "You have reached the final stage." });
        }
    };

    const handlePrevStage = () => {
        if (currentStageIndex > 0) {
            const prevIdx = currentStageIndex - 1;
            setCurrentStageIndex(prevIdx);
            onStageChange?.(activeMethod.stages[prevIdx].id);
        }
    };

    const changeMethod = (methodId: string) => {
        const method = METHODS.find(m => m.id === methodId);
        if (method) {
            setActiveMethod(method);
            setCurrentStageIndex(0);
            toast({ title: "Method Changed", description: `Switched to ${method.title}` });
        }
    };

    // --- Dynamic Observations ---
    const addTile = () => {
        if (newTileName.trim()) {
            setCustomTiles([...customTiles, newTileName]);
            setNewTileName("");
            setIsAddingTile(false);
        }
    };

    const recordObservation = async (label: string) => {
        // Optimistic UI
        toast({ title: "Observation Logged", description: label });
        
        // Phase 25: Sync Logic
        setSyncStatus(isOnline ? 'saving' : 'offline');
        
        // Fake Segment for MVP (In reality, pass to parent to merge with transcript)
        // Ideally LivePage calls SyncEngine, but we do it here for Observation button feedback
        onObservation?.(label); 
        
        setTimeout(() => setSyncStatus(isOnline ? 'synced' : 'offline'), 500);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-full max-w-sm shrink-0 shadow-xl z-20">
            
            {/* 1. Method Selector Header & Sync Status */}
            <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Methodology</span>
                    
                    {/* Phase 25: Sync Indicator */}
                    <div className="flex items-center gap-1">
                        {syncStatus === 'synced' && <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50 border-green-200"><Wifi className="w-3 h-3 mr-1"/> Saved</Badge>}
                        {syncStatus === 'saving' && <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200"><RefreshCw className="w-3 h-3 mr-1 animate-spin"/> Saving...</Badge>}
                        {syncStatus === 'offline' && <Badge variant="destructive" className="text-[10px]"><WifiOff className="w-3 h-3 mr-1"/> Offline</Badge>}
                    </div>
                </div>
                
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">{activeMethod.title}</h2>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-indigo-600 hover:text-indigo-700 p-0">
                                <Edit3 className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {METHODS.map(m => (
                                <DropdownMenuItem key={m.id} onClick={() => changeMethod(m.id)}>
                                    {m.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{activeMethod.description}</p>
            </div>

            {/* 2. Process Stepper (Timeline) */}
            <div className="px-4 py-3 bg-white border-b">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Step {currentStageIndex + 1} of {activeMethod.stages.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5 mb-4" />
                
                <div className="flex items-center justify-between">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={handlePrevStage} 
                        disabled={currentStageIndex === 0}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-center px-2">
                        <Badge variant="secondary" className="mb-1 bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">
                            Current Focus
                        </Badge>
                        <div className="font-bold text-sm text-slate-800">{currentStage.label}</div>
                    </div>

                    <Button 
                        variant="default" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md"
                        onClick={handleNextStage}
                    >
                        {currentStageIndex === activeMethod.stages.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* 3. AI Facilitator Panel */}
            <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold text-sm">
                    <BrainCircuit className="w-4 h-4" />
                    AI Facilitator Prompt
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm relative">
                    <div className="absolute -left-1 top-4 w-1 h-8 bg-indigo-400 rounded-r" />
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                        "{currentStage.ai_prompt}"
                    </p>
                </div>
                <div className="mt-2 flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-100">
                        <HelpCircle className="w-3 h-3 mr-1" /> Suggest Alt Question
                    </Button>
                </div>
            </div>

            {/* 4. Dynamic Observation Grid */}
            <div className="flex-grow flex flex-col min-h-0 bg-slate-50">
                <div className="p-3 border-b bg-white/50 backdrop-blur flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Live Observations</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-slate-200 rounded-full"
                        onClick={() => setIsAddingTile(!isAddingTile)}
                    >
                        {isAddingTile ? <X className="w-4 h-4 text-slate-500"/> : <Plus className="w-4 h-4 text-indigo-600"/>}
                    </Button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto">
                    {/* Add Tile Input */}
                    {isAddingTile && (
                        <div className="mb-3 flex gap-2 animate-in slide-in-from-top-2">
                            <Input 
                                className="h-8 text-sm" 
                                placeholder="Label (e.g. 'Stimming')" 
                                value={newTileName}
                                onChange={(e) => setNewTileName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTile()}
                                autoFocus
                            />
                            <Button size="sm" className="h-8 bg-indigo-600" onClick={addTile}>Add</Button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {customTiles.map((tile, idx) => (
                            <button
                                key={idx}
                                onClick={() => recordObservation(tile)}
                                className="relative group flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/50 transition-all active:scale-95"
                            >
                                <div className="h-2 w-2 rounded-full bg-slate-200 mb-2 group-hover:bg-indigo-400 transition-colors" />
                                <span className="text-xs font-medium text-slate-600 text-center leading-tight group-hover:text-indigo-900">
                                    {tile}
                                </span>
                                {/* Delete Hover */}
                                <div 
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomTiles(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                >
                                    <X className="w-3 h-3 text-red-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
