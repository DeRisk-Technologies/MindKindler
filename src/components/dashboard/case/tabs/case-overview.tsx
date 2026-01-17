// src/components/dashboard/case/tabs/case-overview.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaseFile } from '@/types/case';
import { WorkflowState } from '@/hooks/useStatutoryWorkflow';
import { Calendar, Clock, AlertTriangle, Building, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface CaseOverviewProps {
    caseFile: CaseFile;
    workflow: WorkflowState;
}

export function CaseOverview({ caseFile, workflow }: CaseOverviewProps) {
    const contract = caseFile.contract;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. The Brief / Contract */}
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
                                <Badge variant="outline" className="capitalize">{contract.serviceType.replace('_', ' ')}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Commissioned</p>
                                <p>{format(new Date(contract.commissionedDate), 'PPP')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Deadline</p>
                                <p className="font-bold text-red-600">{format(new Date(contract.dueDate), 'PPP')}</p>
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

            {/* 2. Timeline Status */}
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

            {/* 3. Recent Activity (Audit Trail) */}
            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-600" />
                        Activity Journal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Mock Activity Stream - Connect to 'audit_logs' later */}
                        <div className="flex gap-4 items-start">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <p className="text-sm font-medium">Case Created (Intake)</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(caseFile.createdAt), 'PP p')}</p>
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
        </div>
    );
}
