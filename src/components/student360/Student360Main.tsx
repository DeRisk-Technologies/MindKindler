import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Users, 
  GraduationCap, 
  Scale, 
  Clock 
} from "lucide-react";

import { StudentRecord } from "@/types/schema";
import { Student360Service } from "@/services/student360-service";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface Student360MainProps {
  studentId: string;
  initialData?: StudentRecord; // FIX: Accept pre-loaded data
}

export function Student360Main({ studentId, initialData }: Student360MainProps) {
  const [student, setStudent] = useState<StudentRecord | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return; // Skip if data provided

    async function loadData() {
      try {
        setLoading(true);
        // Fallback to Service Call (which might use Cloud Function or Direct)
        // Given the Pilot issues with Cloud Functions, prefer props
        const data = await Student360Service.getStudent(studentId, 'Dashboard View');
        setStudent(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load secure student record. You may not have permission.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId, initialData]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">{error}</div>;
  if (!student) return <div className="p-8 text-center">Student not found.</div>;

  // Helper for safe access
  const safeVal = (obj: any, path: string) => obj?.[path]?.value || obj?.[path] || 'N/A';
  const getParents = () => student.family?.parents || [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {student.identity.firstName.value} {student.identity.lastName.value}
            <Badge variant={student.meta?.privacyLevel === 'restricted' ? 'destructive' : 'outline'} className="text-xs">
               {student.meta?.privacyLevel === 'restricted' ? <Shield className="h-3 w-3 mr-1" /> : null}
               {student.meta?.privacyLevel?.toUpperCase() || 'STANDARD'} PRIVACY
            </Badge>
          </h1>
          <p className="text-muted-foreground">
             ID: <span className="font-mono text-xs">{student.identity.nationalId?.value || 'N/A'}</span> • 
             DOB: {student.identity.dateOfBirth.value} • 
             Trust Score: <span className={(student.meta?.trustScore || 0) > 80 ? 'text-green-600 font-bold' : 'text-orange-600'}>{student.meta?.trustScore || 0}%</span>
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm">
             <Clock className="h-4 w-4 mr-2" />
             View History
           </Button>
           <Button size="sm">
             Generate Report
           </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="family">Family & Social</TabsTrigger>
          <TabsTrigger value="safeguarding" className="text-orange-700 data-[state=active]:text-orange-800">Safeguarding</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Identity Card */}
              <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                       Identity 
                       <ProvenanceBadge metadata={student.identity.firstName.metadata} />
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                       <span className="text-muted-foreground">Full Name:</span>
                       <span>{student.identity.firstName.value} {student.identity.lastName.value}</span>
                       <span className="text-muted-foreground">Gender:</span>
                       <span>{student.identity.gender.value}</span>
                    </div>
                 </CardContent>
              </Card>

              {/* Education Summary */}
              <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                       Education
                       <GraduationCap className="h-4 w-4 text-gray-500" />
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm space-y-2">
                     <div className="grid grid-cols-2 gap-1">
                       <span className="text-muted-foreground">School:</span>
                       <span>{student.education.currentSchoolId?.value || 'Unknown'}</span>
                       <span className="text-muted-foreground">Year Group:</span>
                       <span>{student.education.yearGroup?.value || 'N/A'}</span>
                       <span className="text-muted-foreground">Attendance:</span>
                       <span>{student.education.attendancePercentage?.value || 0}%</span>
                    </div>
                 </CardContent>
              </Card>

              {/* Alerts / Risks */}
              <Card className="border-l-4 border-l-orange-500">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                       Active Alerts
                       <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm">
                    {student.discipline && student.discipline.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                           {student.discipline.slice(0, 3).map((d: any, index: number) => (
                               <li key={d.id || index} className="text-orange-700">{d.type} ({d.severity})</li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground italic">No active alerts.</p>
                    )}
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Family & Household
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {getParents().length === 0 && <p className="text-muted-foreground">No parent records found.</p>}
                        {getParents().map((parent: any, index: number) => (
                            <div key={parent.id || index} className="flex justify-between items-start p-3 border rounded-lg bg-gray-50">
                                <div>
                                    <p className="font-semibold">{parent.firstName} {parent.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{parent.relationshipType}</p>
                                    {parent.hasParentalResponsibility && (
                                        <Badge variant="secondary" className="mt-1 text-[10px]">Parental Responsibility</Badge>
                                    )}
                                </div>
                                <div className="text-right text-sm">
                                    <p>{parent.email}</p>
                                    <p>{parent.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            {student.careHistory && (
                 <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-800">
                            <Scale className="h-5 w-5" />
                            Care History (Restricted)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-purple-900 mb-2">Looked After Status: <strong>{student.careHistory.isLookedAfter ? 'Yes' : 'No'}</strong></p>
                        <div className="space-y-2">
                            {student.careHistory.placements.map((p: any, index: number) => (
                                <div key={p.id || index} className="bg-white p-2 rounded border border-purple-100 text-sm">
                                    {p.agencyName} ({p.startDate} - {p.endDate || 'Present'})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </TabsContent>

         <TabsContent value="health" className="space-y-4">
            <Card>
                <CardHeader><CardTitle>Medical Profile</CardTitle></CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Activity className="h-4 w-4"/> Allergies</h4>
                            <div className="flex flex-wrap gap-2">
                                {student.health?.allergies?.value?.map((a: string, i: number) => <Badge key={i} variant="outline">{a}</Badge>)}
                                {(!student.health?.allergies?.value || student.health.allergies.value.length === 0) && <span className="text-muted-foreground text-sm">None recorded</span>}
                            </div>
                        </div>
                        <div>
                             <h4 className="font-semibold mb-2">Conditions</h4>
                             <div className="flex flex-wrap gap-2">
                                {student.health?.conditions?.value?.map((c: string, i: number) => <Badge key={i} variant="destructive" className="opacity-80">{c}</Badge>)}
                            </div>
                        </div>
                     </div>
                </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="safeguarding">
             <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
                 <Shield className="h-12 w-12 text-red-500 mx-auto mb-2" />
                 <h3 className="text-lg font-bold text-red-700">Protected Section</h3>
                 <p className="text-sm text-red-600 mb-4">
                     Access to safeguarding incidents is audited. All views are logged.
                 </p>
                 <Button variant="destructive" onClick={() => alert("Access Logged")}>
                     Reveal Incidents
                 </Button>
             </div>
         </TabsContent>

      </Tabs>
    </div>
  );
}
