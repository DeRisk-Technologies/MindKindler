import React, { useState } from 'react';
import { ProvisionSpec, NeedCategory } from '../../types/report';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Wand2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface ProvisionTableEditorProps {
    initialPlan: ProvisionSpec[];
    onSave: (plan: ProvisionSpec[]) => void;
}

export function ProvisionTableEditor({ initialPlan, onSave }: ProvisionTableEditorProps) {
    const [plan, setPlan] = useState<ProvisionSpec[]>(initialPlan);

    const updateRow = (id: string, field: keyof ProvisionSpec, value: string) => {
        setPlan(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const addRow = (category: NeedCategory) => {
        const newRow: ProvisionSpec = {
            id: \`new-\${Date.now()}\`,
            areaOfNeed: category,
            outcome: '',
            provision: '',
            frequency: '',
            staffing: '',
            justificationFindingId: ''
        };
        setPlan(prev => [...prev, newRow]);
    };

    const removeRow = (id: string) => {
        setPlan(prev => prev.filter(r => r.id !== id));
    };

    const triggerAiDraft = () => {
        // Mock Interaction
        alert("Calling Provision Architect to suggest improvements...");
    };

    // Group by Category for Section F Structure
    const categories: NeedCategory[] = ['cognition_learning', 'communication_interaction', 'semh', 'sensory_physical', 'independence_self_care'];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Section F: Provision Plan</h2>
                    <p className="text-sm text-gray-500">Legal Contract of Support. Must be Specific & Quantified.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={triggerAiDraft}>
                        <Wand2 className="w-4 h-4 text-purple-600" /> AI Suggestions
                    </Button>
                    <Button onClick={() => onSave(plan)}>Save Draft</Button>
                </div>
            </div>

            {categories.map(category => {
                const rows = plan.filter(r => r.areaOfNeed === category);
                // Even if empty, show the section so they can add to it
                
                return (
                    <Card key={category} className="overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wider">
                                {category.replace(/_/g, ' ')}
                            </h3>
                            <Button size="sm" variant="ghost" className="h-6" onClick={() => addRow(category)}>
                                <Plus className="w-4 h-4 mr-1" /> Add Provision
                            </Button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-[30%]">Outcome (Section E)</TableHead>
                                        <TableHead className="w-[30%]">Provision (Section F)</TableHead>
                                        <TableHead className="w-[15%]">Frequency</TableHead>
                                        <TableHead className="w-[15%]">Staffing</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-400 py-8 italic">
                                                No provision specified for this area yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map(row => (
                                            <TableRow key={row.id} className="group align-top">
                                                <TableCell className="p-2">
                                                    <Textarea 
                                                        className="min-h-[80px] text-sm resize-none border-transparent focus:border-blue-500 bg-transparent"
                                                        placeholder="By end of Key Stage..."
                                                        value={row.outcome}
                                                        onChange={(e) => updateRow(row.id, 'outcome', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 border-l">
                                                    <Textarea 
                                                        className="min-h-[80px] text-sm resize-none border-transparent focus:border-blue-500 bg-transparent"
                                                        placeholder="Specific intervention..."
                                                        value={row.provision}
                                                        onChange={(e) => updateRow(row.id, 'provision', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 border-l">
                                                    <Input 
                                                        className="h-full border-transparent focus:border-blue-500 bg-transparent"
                                                        placeholder="e.g. Weekly"
                                                        value={row.frequency}
                                                        onChange={(e) => updateRow(row.id, 'frequency', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 border-l">
                                                    <Input 
                                                        className="h-full border-transparent focus:border-blue-500 bg-transparent"
                                                        placeholder="e.g. TA"
                                                        value={row.staffing}
                                                        onChange={(e) => updateRow(row.id, 'staffing', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                                                        onClick={() => removeRow(row.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
