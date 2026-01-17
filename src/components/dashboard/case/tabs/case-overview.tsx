// src/components/dashboard/case/tabs/case-overview.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CaseFile } from '@/types/case';
import { WorkflowState } from '@/hooks/useStatutoryWorkflow';
import { Calendar, Clock, AlertTriangle, FileText, Activity, User, School, Users, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { StudentEditDialog } from '@/components/student360/dialogs/StudentEditDialog'; 
import { doc, getDoc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

interface CaseOverviewProps {
    caseFile: CaseFile;
    workflow: WorkflowState;
}

export function CaseOverview({ caseFile, workflow }: CaseOverviewProps) {
    const { user } = useAuth();
    const contract = caseFile.contract;
    const [editOpen, setEditOpen] = useState(false);
    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [loadingStudent, setLoadingStudent] = useState(true);

    // Fetch Student Details explicitly to get linked names (School/Parent)
    // We assume 'caseFile' might only have ID/Name snapshot
    useEffect(() => {
        async function loadStudent() {
            if (!user || !caseFile.studentId) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                const snap = await getDoc(doc(db, 'students', caseFile.studentId));
                if (snap.exists()) {
                    const data = snap.data();
                    
                    // Fetch Linked Names (Naive approach: sequential)
                    let schoolName = 'Unknown School';
                    let parentName = 'Unknown Parent';

                    if (data.schoolId) {
                        const sSnap = await getDoc(doc(db, 'schools', data.schoolId));
                        if (sSnap.exists()) schoolName = sSnap.data().name;
                    }
                    if (data.parentId) {
                        const pSnap = await getDoc(doc(db, 'users', data.parentId));
                        if (pSnap.exists()) parentName = pSnap.data().displayName;
                    }

                    setStudentDetails({ ...data, schoolName, parentName });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingStudent(false);
            }
        }
        loadStudent();
    }, [caseFile.studentId, user, editOpen]); // Reload on edit close

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Student Profile (NEW) */}
            <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Student Profile</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {loadingStudent ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6"/></div>
                    ) : studentDetails ? (
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {studentDetails.firstName?.[0]}{studentDetails.lastName?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold">{studentDetails.firstName} {studentDetails.lastName}</p>
                                    <p className="text-xs text-muted-foreground">DOB: {studentDetails.dob}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm border-t pt-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <School className="h-4 w-4" />
                                    <span>{studentDetails.schoolName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="h-4 w-4" />
                                    <span>{studentDetails.parentName}</span>
                                </div>
                                {studentDetails.upn && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <span className="font-mono text-xs bg-slate-100 px-1 rounded">UPN: {studentDetails.upn}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Student data unavailable.</p>
                    )}
                </CardContent>
            </Card>

            {/* 2. The Brief / Contract */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Engagement Brief
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {contract ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Client</p>
                                <p className="font-semibold">{contract.clientName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Service Type</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {contract.serviceTypes?.map(type => (
                                        <Badge key={type} variant="outline" className="capitalize">
                                            {type.replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                    {/* Fallback for legacy single type */}
                                    {!contract.serviceTypes && contract.serviceType && (
                                        <Badge variant="outline" className="capitalize">
                                            {contract.serviceType.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Commissioned</p>
                                <p>{contract.commissionedDate ? format(new Date(contract.commissionedDate), 'PPP') : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Deadline</p>
                                <p className="font-bold text-red-600">{contract.dueDate ? format(new Date(contract.dueDate), 'PPP') : 'N/A'}</p>
                            </div>
                            {contract.specialInstructions && (
                                <div className="col-span-2 bg-yellow-50 p-3 rounded-md border border-yellow-100 text-sm text-yellow-900 mt-2">
                                    <strong>Instructions:</strong> {contract.specialInstructions}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground mb-2">No contract details defined.</p>
                            <Badge>Internal Case</Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Timeline Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Timeline Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* EPP Deadline */}
                    {workflow.daysUntilContractDeadline !== null && (
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium">Your Deadline</span>
                                <span className={`text-xl font-bold ${workflow.ragStatus === 'red' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {workflow.daysUntilContractDeadline} Days
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${workflow.ragStatus === 'red' ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: '60%' }} // Dynamic calc needed
                                /> 
                            </div>
                        </div>
                    )}

                    {/* LA Context */}
                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">LA Statutory Context (20 Weeks)</p>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">Week {Math.floor((20 * 7 - workflow.daysUntilFinalDeadline) / 7)}</Badge>
                            <span className="text-xs text-slate-500">of 20</span>
                        </div>
                        {workflow.isBreachRisk && (
                            <div className="flex items-center gap-1 text-red-600 text-xs font-bold mt-2">
                                <AlertTriangle className="w-3 h-3" />
                                LA Breach Risk High
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 4. Recent Activity (Audit Trail) */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-600" />
                        Activity Journal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <p className="text-sm font-medium">Case Created (Intake)</p>
                                <p className="text-xs text-muted-foreground">{caseFile.createdAt ? format(new Date(caseFile.createdAt), 'PP p') : 'Unknown'}</p>
                            </div>
                        </div>
                        {caseFile.lastActivity && (
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">{caseFile.lastActivity}</p>
                                    <p className="text-xs text-muted-foreground">Just now</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <StudentEditDialog 
                open={editOpen} 
                onOpenChange={setEditOpen} 
                studentId={caseFile.studentId}
            />
        </div>
    );
}
