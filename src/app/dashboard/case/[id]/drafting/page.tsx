"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { FindingsManager } from '@/components/reporting/FindingsManager';
import { ProvisionTableEditor } from '@/components/reporting/ProvisionTableEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, FileText, LayoutGrid } from 'lucide-react';
import { Finding, ProvisionSpec } from '@/types/report';

// Mock Data
const MOCK_FINDINGS: Finding[] = [
    {
        id: 'f1',
        sourceId: 'Parent Form',
        category: 'cognition_learning',
        text: 'Mother reports huge difficulty retaining phonics sounds from one day to the next.',
        isContested: false,
        confidence: 0.9,
        topics: ['literacy', 'memory']
    },
    {
        id: 'f2',
        sourceId: 'School Report',
        category: 'cognition_learning',
        text: 'Teacher states retention is adequate when visual aids are used.',
        isContested: true, // Contradicts f1
        confidence: 0.85,
        topics: ['literacy', 'memory']
    },
    {
        id: 'f3',
        sourceId: 'Medical',
        category: 'sensory_physical',
        text: 'Audiology confirms mild hearing loss in left ear.',
        isContested: false,
        confidence: 0.99,
        topics: ['hearing']
    }
];

const MOCK_PROVISION: ProvisionSpec[] = [
    {
        id: 'p1',
        areaOfNeed: 'cognition_learning',
        outcome: 'Will be able to read 50 high freq words.',
        provision: 'Daily 1:1 Precision Teaching',
        frequency: '10 mins daily',
        staffing: 'TA',
        justificationFindingId: 'f1'
    }
];

export default function DraftingPage() {
    const params = useParams();
    const [findings, setFindings] = useState(MOCK_FINDINGS);
    const [provision, setProvision] = useState(MOCK_PROVISION);

    const handleSaveFindings = (updated: Finding[]) => {
        setFindings(updated);
        console.log("Saved Findings:", updated);
    };

    const handleSaveProvision = (updated: ProvisionSpec[]) => {
        setProvision(updated);
        console.log("Saved Provision:", updated);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            
            {/* Workspace Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Report Workspace</h1>
                    <p className="text-xs text-gray-500">Student: Alex Thompson • Draft v1.0</p>
                </div>
                
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export DOCX
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        Generate Preview
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-6">
                <Tabs defaultValue="evidence" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                        <TabsTrigger value="evidence" className="gap-2">
                            <FileText className="w-4 h-4" /> Evidence Base
                        </TabsTrigger>
                        <TabsTrigger value="provision" className="gap-2">
                            <LayoutGrid className="w-4 h-4" /> Provision Plan
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="evidence" className="outline-none">
                        <FindingsManager 
                            initialFindings={findings} 
                            onSave={handleSaveFindings} 
                        />
                    </TabsContent>
                    
                    <TabsContent value="provision" className="outline-none">
                        <ProvisionTableEditor 
                            initialPlan={provision} 
                            onSave={handleSaveProvision} 
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
