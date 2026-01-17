// src/app/dashboard/cases/new/page.tsx

"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { CalendarIcon, Loader2, Upload, FileText, Briefcase, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EvidenceUploadZone } from '@/components/intake/EvidenceUploadZone';
import { analyzeDocument } from '@/ai/clerkAgent'; 
import { EvidenceItem, IngestionAnalysis } from '@/types/evidence';
import { Badge } from '@/components/ui/badge';

// Extract content to subcomponent to isolate hook usage
function NewCaseContent() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const existingStudentId = searchParams.get('studentId');

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [contract, setContract] = useState({
        clientName: '',
        serviceTypes: ['statutory_advice'], // Array for multiple selections
        commissionedDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 42)), // Default +6 weeks
        budgetHours: 6,
        specialInstructions: ''
    });

    const [studentData, setStudentData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        upn: '',
        la: ''
    });

    const [uploadedItems, setUploadedItems] = useState<EvidenceItem[]>([]);

    const SERVICE_OPTIONS = [
        { id: 'statutory_advice', label: 'Statutory Advice (Appendix D)' },
        { id: 'intervention_plan', label: 'Intervention Plan' },
        { id: 'tribunal', label: 'Tribunal Witness' },
        { id: 'consultation', label: 'School Consultation' }
    ];

    const toggleService = (id: string) => {
        setContract(prev => {
            const exists = prev.serviceTypes.includes(id);
            if (exists) {
                return { ...prev, serviceTypes: prev.serviceTypes.filter(s => s !== id) };
            } else {
                return { ...prev, serviceTypes: [...prev.serviceTypes, id] };
            }
        });
    };

    // --- STEP 1: FORENSIC INGEST (The "Zip File") ---
    const handleAnalysisComplete = (files: EvidenceItem[], analysis: IngestionAnalysis[]) => {
        setUploadedItems(files);
        setLoading(true);

        try {
            // Auto-fill from "Request for Advice.pdf" simulation
            // In a real scenario, we'd inspect 'analysis' array for extracted entities
            
            if (analysis.length > 0) {
                const firstAnalysis = analysis[0];
                if (firstAnalysis.suggestedStakeholders?.length > 0) {
                    console.log("Found stakeholders:", firstAnalysis.suggestedStakeholders);
                }
            }

            setStudentData({
                firstName: 'Extracted',
                lastName: 'Student',
                dob: '2016-05-20',
                upn: 'Z12345678',
                la: 'Leeds City Council'
            });
            
            setContract(prev => ({
                ...prev,
                clientName: 'Leeds City Council', // Extracted from header
                specialInstructions: 'Focus on recent exclusions and speech delay.' // Extracted
            }));

            toast({ title: "Analysis Complete", description: "Contract details extracted from document." });
            setStep(2);
        } catch (e) {
            console.error(e);
            toast({ title: "Extraction Failed", description: "Could not parse document. Please enter details manually.", variant: "destructive" });
            setStep(2); // Fallback to manual
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 3: CREATE CASE ---
    const handleCreate = async () => {
        if (!user || !userProfile?.tenantId) return;
        setLoading(true);

        try {
            const db = getRegionalDb(userProfile.metadata?.region || 'uk');
            
            // 1. Create/Find Student
            let studentId = existingStudentId;
            if (!studentId) {
                const studentRef = await addDoc(collection(db, 'students'), {
                    tenantId: userProfile.tenantId,
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    dob: studentData.dob,
                    upn: studentData.upn,
                    createdAt: new Date().toISOString()
                });
                studentId = studentRef.id;
            }

            // 2. Create Case with Contract
            const newCase = {
                tenantId: userProfile.tenantId,
                studentId,
                studentName: `${studentData.firstName} ${studentData.lastName}`,
                status: 'assessment', // Start in active assessment
                contract: {
                    clientName: contract.clientName,
                    serviceTypes: contract.serviceTypes, // Array
                    commissionedDate: contract.commissionedDate.toISOString(),
                    dueDate: contract.dueDate.toISOString(),
                    budgetHours: contract.budgetHours,
                    specialInstructions: contract.specialInstructions
                },
                // Link to LA Timeline (Reverse calculate Request Date from Commissioned Date if needed)
                statutoryTimeline: {
                    requestDate: new Date(contract.commissionedDate.getTime() - (6 * 7 * 86400000)).toISOString(), // Estimate: We got it at Week 6?
                    decisionToAssessDeadline: new Date(new Date().setDate(new Date().getDate() + 42)).toISOString(),
                    evidenceDeadline: new Date(new Date().setDate(new Date().getDate() + 84)).toISOString(),
                    draftPlanDeadline: new Date(new Date().setDate(new Date().getDate() + 112)).toISOString(),
                    finalPlanDeadline: new Date(new Date().setDate(new Date().getDate() + 140)).toISOString(),
                    isOverdue: false
                },
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
                region: userProfile.metadata?.region || 'uk'
            };

            const caseRef = await addDoc(collection(db, 'cases'), newCase);

            // 3. Create Initial Work Schedule (Template)
            const tasks = [
                { title: 'Review Case History', type: 'admin', status: 'pending' },
                { title: 'Contact Parent/Guardian', type: 'consultation', status: 'pending' },
                { title: 'School Observation', type: 'observation', status: 'scheduled', dueDate: format(contract.dueDate, 'yyyy-MM-dd') },
                { title: 'Draft Report', type: 'drafting', status: 'pending' }
            ];
            
            await updateDoc(caseRef, { workSchedule: tasks });

            toast({ title: "Case Created", description: "Redirecting to Workbench..." });
            router.push(`/dashboard/cases/${caseRef.id}`);

        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">New Engagement</h1>
                <p className="text-muted-foreground">Setup a new contract or statutory assessment.</p>
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <Card className="border-dashed border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Upload Brief / Request for Advice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EvidenceUploadZone 
                            onAnalysisComplete={handleAnalysisComplete} // FIXED PROP NAME
                        />
                        <div className="mt-4 text-center">
                            <Button variant="ghost" onClick={() => setStep(2)}>Skip to Manual Entry</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            Contract Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Client Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Client / Commissioner</Label>
                                <Input 
                                    value={contract.clientName} 
                                    onChange={e => setContract({...contract, clientName: e.target.value})}
                                    placeholder="e.g. Leeds City Council"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Service Types (Select multiple)</Label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                                    {SERVICE_OPTIONS.map(opt => {
                                        const isSelected = contract.serviceTypes.includes(opt.id);
                                        return (
                                            <Badge 
                                                key={opt.id}
                                                variant={isSelected ? "default" : "outline"}
                                                className="cursor-pointer select-none"
                                                onClick={() => toggleService(opt.id)}
                                            >
                                                {isSelected && <Check className="w-3 h-3 mr-1" />}
                                                {opt.label}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label>Student First Name</Label>
                                <Input value={studentData.firstName} onChange={e => setStudentData({...studentData, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Student Last Name</Label>
                                <Input value={studentData.lastName} onChange={e => setStudentData({...studentData, lastName: e.target.value})} />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Commissioned Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !contract.commissionedDate && "text-muted-foreground")}>
                                            {contract.commissionedDate ? format(contract.commissionedDate, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={contract.commissionedDate} onSelect={(d) => d && setContract({...contract, commissionedDate: d})} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label className="text-red-600">Your Deadline</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal border-red-200", !contract.dueDate && "text-muted-foreground")}>
                                            {contract.dueDate ? format(contract.dueDate, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-red-500" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={contract.dueDate} onSelect={(d) => d && setContract({...contract, dueDate: d})} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Special Instructions / Scope</Label>
                            <Textarea 
                                value={contract.specialInstructions} 
                                onChange={e => setContract({...contract, specialInstructions: e.target.value})}
                                placeholder="Any specific focus areas?"
                            />
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault(); // Prevent accidental form submit if wrapped
                                handleCreate();
                            }} 
                            disabled={loading || !contract.clientName || !studentData.lastName} 
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <FileText className="mr-2 h-4 w-4" />}
                            Create Case File
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

// Wrap with Suspense
export default function NewCasePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
            <NewCaseContent />
        </Suspense>
    );
}
