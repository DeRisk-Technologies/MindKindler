import React, { useState, useEffect } from 'react';
import { IngestionAnalysis, DetectedDate } from '../../types/evidence';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox'; // Assuming generic checkbox
import { Label } from '../../components/ui/label';
import { Calendar, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';

interface FactCheckerProps {
    analyses: IngestionAnalysis[];
    onConfirm: (data: { requestDate: string; dob: string; acknowledgedRisks: boolean }) => void;
}

export function FactChecker({ analyses, onConfirm }: FactCheckerProps) {
    const [requestDate, setRequestDate] = useState<string>('');
    const [dob, setDob] = useState<string>('');
    const [risks, setRisks] = useState<string[]>([]);
    const [risksAcknowledged, setRisksAcknowledged] = useState(false);

    // Initial AI Population
    useEffect(() => {
        let foundReq = '';
        let foundDob = '';
        const foundRisks: string[] = [];

        analyses.forEach(a => {
            // Find Request Date
            const req = a.detectedDates.find(d => d.label === 'request_date');
            if (req && !foundReq) foundReq = req.dateIso;

            // Find DOB
            const db = a.detectedDates.find(d => d.label === 'dob');
            if (db && !foundDob) foundDob = db.dateIso;

            // Aggregate Risks
            if (a.riskSignals && a.riskSignals.length > 0) {
                foundRisks.push(...a.riskSignals);
            }
        });

        // Defaults if AI failed
        if (!foundReq) foundReq = format(new Date(), 'yyyy-MM-dd'); // Default to Today
        
        setRequestDate(foundReq);
        setDob(foundDob);
        setRisks(Array.from(new Set(foundRisks))); // Dedup
    }, [analyses]);

    const handleComplete = () => {
        if (!requestDate) return alert("Statutory Start Date is required.");
        if (risks.length > 0 && !risksAcknowledged) return alert("You must acknowledge the risk signals.");
        
        onConfirm({ requestDate, dob, acknowledgedRisks: risksAcknowledged });
    };

    return (
        <div className="space-y-8">
            
            {/* 1. Dates Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Critical Statutory Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                            <div className="w-full">
                                <Label className="text-sm font-bold text-gray-700">Request Received Date (Week 0)</Label>
                                <p className="text-xs text-gray-500 mb-2">This sets the 20-week statutory clock.</p>
                                <Input 
                                    type="date" 
                                    value={requestDate} 
                                    onChange={(e) => setRequestDate(e.target.value)} 
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                            <div className="w-full">
                                <Label className="text-sm font-bold text-gray-700">Date of Birth</Label>
                                <p className="text-xs text-gray-500 mb-2">Used for Age-Based Protocols.</p>
                                <Input 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e) => setDob(e.target.value)} 
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* 2. Risks Section */}
            {risks.length > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-bold text-red-800">Risk Signals Detected</h3>
                    </div>
                    
                    <ul className="list-disc pl-5 space-y-2 mb-6 text-sm text-red-800">
                        {risks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="risk-ack" 
                            checked={risksAcknowledged} 
                            onCheckedChange={(checked) => setRisksAcknowledged(checked === true)}
                        />
                        <Label htmlFor="risk-ack" className="text-sm font-medium text-red-900 cursor-pointer">
                            I have reviewed these risks and initiated safeguarding protocols if necessary.
                        </Label>
                    </div>
                </div>
            ) : (
                 <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">No explicit high-risk keywords detected by AI.</span>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button onClick={handleComplete} size="lg" className="w-full md:w-auto">
                    Finalize Intake <Check className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
