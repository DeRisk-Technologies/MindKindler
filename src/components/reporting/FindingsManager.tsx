import React, { useState } from 'react';
import { Finding, NeedCategory } from '../../types/report';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Check, X, Edit2, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FindingsManagerProps {
    initialFindings: Finding[];
    onSave: (approvedFindings: Finding[]) => void;
}

export function FindingsManager({ initialFindings, onSave }: FindingsManagerProps) {
    const [findings, setFindings] = useState<Finding[]>(initialFindings);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Categorize for Display
    const categories: NeedCategory[] = ['cognition_learning', 'communication_interaction', 'semh', 'sensory_physical', 'independence_self_care'];
    
    // Actions
    const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
        // In a real app, we might add a status field to the Finding type. 
        // Here we'll simulate "Rejection" by removing it from the list or visually dimming.
        // For this demo: Toggle specific state or remove.
        console.log(\`Set \${id} to \${status}\`);
        // Mock: If approved, maybe turn border green?
    };

    const startEdit = (finding: Finding) => {
        setEditingId(finding.id);
        setEditText(finding.text);
    };

    const saveEdit = (id: string) => {
        setFindings(prev => prev.map(f => f.id === id ? { ...f, text: editText } : f));
        setEditingId(null);
    };

    const getCategoryLabel = (cat: string) => {
        return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Evidence Base (Triangulation)</h2>
                    <p className="text-sm text-gray-500">Review and approve clinical assertions extracted by AI.</p>
                </div>
                <Button onClick={() => onSave(findings)}>Save Changes</Button>
            </div>

            {categories.map(category => {
                const categoryFindings = findings.filter(f => f.category === category);
                if (categoryFindings.length === 0) return null;

                return (
                    <Card key={category} className="border-t-4 border-t-blue-500">
                        <CardHeader className="bg-gray-50 py-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-gray-700">
                                {getCategoryLabel(category)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {categoryFindings.map(finding => (
                                    <div 
                                        key={finding.id} 
                                        className={cn(
                                            "p-4 flex flex-col md:flex-row gap-4 group transition-colors hover:bg-gray-50",
                                            finding.isContested ? "bg-amber-50 hover:bg-amber-100" : ""
                                        )}
                                    >
                                        {/* Left: Content */}
                                        <div className="flex-1 space-y-2">
                                            {/* Discrepancy Alert */}
                                            {finding.isContested && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Contradiction Detected</span>
                                                </div>
                                            )}

                                            {/* Text Editor or Display */}
                                            {editingId === finding.id ? (
                                                <div className="flex gap-2">
                                                    <Textarea 
                                                        value={editText} 
                                                        onChange={(e) => setEditText(e.target.value)} 
                                                        className="min-h-[60px]"
                                                    />
                                                    <Button size="sm" onClick={() => saveEdit(finding.id)}>Save</Button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-800 leading-relaxed">
                                                    {finding.text}
                                                </p>
                                            )}
                                            
                                            {/* Metadata */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs bg-white flex items-center gap-1 cursor-pointer hover:border-blue-300">
                                                    <FileText className="w-3 h-3" />
                                                    Source: {finding.sourceId}
                                                </Badge>
                                                {finding.confidence < 0.7 && (
                                                    <Badge variant="secondary" className="text-xs text-gray-500">
                                                        Low Confidence
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-start gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-green-600 hover:bg-green-100"
                                                title="Approve"
                                                onClick={() => handleStatusChange(finding.id, 'approved')}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                                                title="Edit"
                                                onClick={() => startEdit(finding)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-600 hover:bg-red-100"
                                                title="Reject"
                                                onClick={() => handleStatusChange(finding.id, 'rejected')}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
