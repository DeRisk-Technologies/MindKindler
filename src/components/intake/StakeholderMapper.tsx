import React, { useState, useEffect } from 'react';
import { IngestionAnalysis, ExtractedStakeholder } from '../../types/evidence';
import { Stakeholder, StakeholderRole } from '../../types/case';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { UserPlus, Trash2, Check, User } from 'lucide-react';

interface StakeholderMapperProps {
    analyses: IngestionAnalysis[];
    onConfirm: (confirmedStakeholders: Stakeholder[]) => void;
}

export function StakeholderMapper({ analyses, onConfirm }: StakeholderMapperProps) {
    const [candidates, setCandidates] = useState<Stakeholder[]>([]);

    // Initialize candidates from AI Analysis on mount
    useEffect(() => {
        const extracted: Stakeholder[] = [];
        
        analyses.forEach(analysis => {
            analysis.extractedStakeholders.forEach((person, idx) => {
                // Deduplicate simple check (by name)
                if (!extracted.find(e => e.name === person.name)) {
                    extracted.push({
                        id: \`temp-\${idx}-\${Math.random()}\`,
                        name: person.name,
                        role: mapRole(person.role),
                        contactInfo: {
                            email: person.email || '',
                            phone: person.phone || ''
                        },
                        consentStatus: 'pending',
                        contributionStatus: 'not_requested'
                    });
                }
            });
        });

        if (candidates.length === 0) {
            setCandidates(extracted);
        }
    }, [analyses]);

    const mapRole = (aiRole: string): StakeholderRole => {
        const valid: StakeholderRole[] = ['parent', 'senco', 'social_worker', 'pediatrician', 'class_teacher', 'epp_lead'];
        return valid.includes(aiRole as any) ? (aiRole as StakeholderRole) : 'class_teacher'; // Default fallback
    };

    const updateCandidate = (id: string, field: string, value: any) => {
        setCandidates(prev => prev.map(c => {
            if (c.id !== id) return c;
            if (field === 'role') return { ...c, role: value };
            if (field === 'email') return { ...c, contactInfo: { ...c.contactInfo, email: value } };
            return c;
        }));
    };

    const removeCandidate = (id: string) => {
        setCandidates(prev => prev.filter(c => c.id !== id));
    };

    const addManual = () => {
        setCandidates(prev => [...prev, {
            id: \`manual-\${Date.now()}\`,
            name: '',
            role: 'class_teacher',
            contactInfo: { email: '' },
            consentStatus: 'pending',
            contributionStatus: 'not_requested'
        }]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Verify Stakeholders</h3>
                    <p className="text-sm text-gray-500">The AI found these contacts. Please confirm their roles.</p>
                </div>
                <Button onClick={addManual} variant="outline" size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" /> Add Person
                </Button>
            </div>

            <div className="grid gap-4">
                {candidates.map((person) => (
                    <Card key={person.id} className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            
                            {/* Icon / Avatar */}
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                <User className="w-5 h-5" />
                            </div>

                            {/* Inputs */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                                    <Input 
                                        value={person.name} 
                                        onChange={(e) => setCandidates(prev => prev.map(c => c.id === person.id ? { ...c, name: e.target.value } : c))}
                                        placeholder="Full Name" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
                                    <Select 
                                        value={person.role} 
                                        onValueChange={(val) => updateCandidate(person.id, 'role', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parent">Parent / Carer</SelectItem>
                                            <SelectItem value="senco">SENCO</SelectItem>
                                            <SelectItem value="social_worker">Social Worker</SelectItem>
                                            <SelectItem value="class_teacher">Class Teacher</SelectItem>
                                            <SelectItem value="pediatrician">Pediatrician</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                                    <Input 
                                        value={person.contactInfo.email} 
                                        onChange={(e) => updateCandidate(person.id, 'email', e.target.value)}
                                        placeholder="email@school.org" 
                                    />
                                </div>
                            </div>

                            {/* Delete */}
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeCandidate(person.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
            
            <div className="flex justify-end pt-4">
                 <Button onClick={() => onConfirm(candidates)} className="w-full md:w-auto">
                    Confirm {candidates.length} Stakeholders <Check className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
