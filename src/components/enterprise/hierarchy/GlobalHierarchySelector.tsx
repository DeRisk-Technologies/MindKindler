"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { HierarchyLevel, OrgUnit } from '@/types/hierarchy';
import { Loader2, Plus, Check, MapPin, Building2, ShieldCheck, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HierarchyBuilderProps {
    onComplete: (selectedNode: OrgUnit) => void;
    initialCountry?: string;
}

export function GlobalHierarchySelector({ onComplete, initialCountry = 'US' }: HierarchyBuilderProps) {
    const [country, setCountry] = useState(initialCountry);
    const { rootDef, fetchChildren, addManualNode, loading } = useHierarchy(country);
    
    // The stack of selected nodes: [National, State, County...]
    const [selectionStack, setSelectionStack] = useState<OrgUnit[]>([]);
    
    // The current level definition we are trying to fill
    const [currentLevelDef, setCurrentLevelDef] = useState<HierarchyLevel | null>(null);
    
    // The list of options for the current dropdown
    const [currentOptions, setCurrentOptions] = useState<OrgUnit[]>([]);

    // Manual Add State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState("");

    // 1. Init: Load Root
    useEffect(() => {
        if (rootDef) {
            setSelectionStack([]); // Reset
            setCurrentLevelDef(rootDef);
            loadOptions('root', rootDef.type);
        }
    }, [rootDef, country]);

    // 2. Load Options Helper
    const loadOptions = async (parentId: string, type: string) => {
        const children = await fetchChildren(parentId, type, country);
        setCurrentOptions(children);
    };

    // 3. Handle Selection (Drill Down)
    const handleSelect = async (nodeId: string) => {
        const selectedNode = currentOptions.find(n => n.id === nodeId);
        if (!selectedNode) return;

        // Push to stack
        const newStack = [...selectionStack, selectedNode];
        setSelectionStack(newStack);

        // Determine next level
        let nextDef: HierarchyLevel | null | undefined = rootDef;
        for (let i = 0; i < newStack.length; i++) {
            if (nextDef && typeof nextDef.nextLevel === 'function') {
                nextDef = nextDef.nextLevel(newStack[i]);
            } else if (nextDef?.nextLevel) {
                nextDef = nextDef.nextLevel;
            } else {
                nextDef = null;
            }
        }

        if (nextDef) {
            setCurrentLevelDef(nextDef);
            await loadOptions(selectedNode.id, nextDef.type);
        } else {
            // Reached leaf or end of definition
            setCurrentLevelDef(null);
            onComplete(selectedNode);
        }
    };

    // 4. Handle "Select THIS Level" (Stop Here)
    const handleStopHere = () => {
        if (selectionStack.length > 0) {
            const currentNode = selectionStack[selectionStack.length - 1];
            setCurrentLevelDef(null); // Stop the wizard
            onComplete(currentNode);
        }
    };

    const handleAddManual = async () => {
        if (!newItemName || !currentLevelDef) return;
        
        const parent = selectionStack.length > 0 ? selectionStack[selectionStack.length - 1] : null;
        
        // Determine Shard based on Country (Mock logic)
        const shardMap: Record<string, string> = { 
            'US': 'us-central1', 
            'UK': 'europe-west2', 
            'JP': 'asia-northeast1', 
            'DE': 'europe-west3',
            'FR': 'europe-west1',
            'SA': 'me-central2'
        };
        
        const newUnit = await addManualNode(
            parent, 
            newItemName, 
            currentLevelDef.type, 
            shardMap[country] || 'europe-west3'
        );

        // Auto-select the new item
        setCurrentOptions([...currentOptions, newUnit]); 
        handleSelect(newUnit.id);
        setIsAddModalOpen(false);
        setNewItemName("");
    };

    // Check if the PREVIOUS level (the one currently selected in the stack) was a valid tenant root
    const canSelectCurrentParent = () => {
        if (selectionStack.length === 0) return false;
        
        // We need to find the definition for the *last selected* item
        let def: HierarchyLevel | null | undefined = rootDef;
        for (let i = 0; i < selectionStack.length - 1; i++) {
             if (def && typeof def.nextLevel === 'function') {
                def = def.nextLevel(selectionStack[i]);
            } else if (def?.nextLevel) {
                def = def.nextLevel;
            }
        }
        
        return def?.canBeTenantRoot;
    };

    return (
        <Card className="w-full max-w-2xl border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600"/>
                    Universal Organization Registrar
                </CardTitle>
                <CardDescription>
                    Select or register your institution within the official national hierarchy.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Country Selector */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Jurisdiction</label>
                    <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="US">🇺🇸 United States</SelectItem>
                            <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                            <SelectItem value="FR">🇫🇷 France</SelectItem>
                            <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                            <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Breadcrumbs of Selection */}
                {selectionStack.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                        <div className="flex flex-wrap gap-2 items-center">
                            {selectionStack.map((node, i) => (
                                <div key={node.id} className="flex items-center text-sm">
                                    <Badge variant="secondary" className="mr-2 uppercase text-[10px]">{node.type.replace('_', ' ')}</Badge>
                                    <span className="font-semibold">{node.name}</span>
                                    {i < selectionStack.length - 1 && <span className="mx-2 text-muted-foreground">→</span>}
                                </div>
                            ))}
                        </div>
                        
                        {/* "Stop Here" Button for the active parent */}
                        {currentLevelDef && canSelectCurrentParent() && (
                            <div className="flex justify-end pt-2 border-t border-dashed mt-2">
                                <Button size="sm" variant="secondary" onClick={handleStopHere} className="text-xs h-7 bg-green-100 hover:bg-green-200 text-green-800 border border-green-200">
                                    <MousePointerClick className="mr-2 h-3 w-3"/> 
                                    Register <strong>{selectionStack[selectionStack.length-1].name}</strong> as Tenant
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Selection Step */}
                {currentLevelDef && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50 rounded border border-dashed">
                        <label className="text-sm font-medium text-blue-800 flex justify-between">
                            {currentLevelDef.label}
                            {currentLevelDef.canBeTenantRoot && <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">Billable Entity</Badge>}
                        </label>
                        <div className="flex gap-2">
                            <Select onValueChange={handleSelect}>
                                <SelectTrigger className="flex-1 bg-white">
                                    <SelectValue placeholder={`Choose ${currentLevelDef.type}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            {opt.name} {opt.isTenantRoot && '(Tenant)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {currentLevelDef.allowManualEntry && (
                                <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2"/> Add New
                                </Button>
                            )}
                        </div>
                        
                        {currentOptions.length === 0 && !loading && (
                            <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                                <Building2 className="h-3 w-3"/>
                                No records found. {currentLevelDef.allowManualEntry ? 'Please add it manually.' : 'Contact support if your region is missing.'}
                            </div>
                        )}
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                )}

                {/* Completion State */}
                {!currentLevelDef && selectionStack.length > 0 && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200 flex flex-col gap-2 animate-in zoom-in-95">
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5"/>
                            <span className="font-bold text-lg">Target: {selectionStack[selectionStack.length-1].name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4"/>
                            <span>Type: {selectionStack[selectionStack.length-1].type.toUpperCase().replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                            This node will be designated as your <strong>Primary Tenant Root</strong>. 
                            You will manage all entities below this level.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setCurrentLevelDef(rootDef)} className="mt-2 w-full bg-white hover:bg-green-100 text-green-800 border-green-300">
                            Reset / Start Over
                        </Button>
                    </div>
                )}

            </CardContent>

            {/* Add Manual Record Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register New {currentLevelDef?.type}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Official Name</label>
                            <Input 
                                value={newItemName} 
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder={`e.g. ${currentLevelDef?.type === 'school' ? 'Lincoln High School' : 'North District'}`}
                            />
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
                            <strong>Note:</strong> This will create a new permanent record in the Global Registry linked to 
                            <em> {selectionStack[selectionStack.length-1]?.name}</em>.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddManual}>Register & Select</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
