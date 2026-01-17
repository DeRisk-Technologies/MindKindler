// src/components/dashboard/case/tabs/case-evidence.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservationMode } from '@/components/assessments/ObservationMode'; // Existing Tool
import { Button } from '@/components/ui/button';
import { Mic, FileText, Activity } from 'lucide-react';

export function CaseEvidence({ caseId, studentId }: { caseId: string, studentId: string }) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Evidence Lab</h3>
            
            <Tabs defaultValue="observation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="observation">Observation</TabsTrigger>
                    <TabsTrigger value="consultation">Consultation</TabsTrigger>
                    <TabsTrigger value="direct_work">Direct Work</TabsTrigger>
                </TabsList>

                {/* Sub-Tab 1: Observation */}
                <TabsContent value="observation" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Classroom Observation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ObservationMode />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sub-Tab 2: Consultation */}
                <TabsContent value="consultation" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Consultation Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center p-8 space-y-4">
                                <Button size="lg" className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 shadow-lg">
                                    <Mic className="h-8 w-8 text-white" />
                                </Button>
                                <p className="text-sm text-muted-foreground">Start Recording / Dictation</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sub-Tab 3: Direct Work (Assessments) */}
                <TabsContent value="direct_work" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Standardized Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-24 flex flex-col gap-2">
                                    <Activity className="w-6 h-6" />
                                    WISC-V Input
                                </Button>
                                <Button variant="outline" className="h-24 flex flex-col gap-2">
                                    <Activity className="w-6 h-6" />
                                    Dynamic Assessment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
