"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student, AssessmentResult, ExternalAcademicRecord, AttendanceRecord, Case } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, TrendingDown, BookOpen, Clock, Activity, BrainCircuit } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data Buckets
  const [internalAssessments, setInternalAssessments] = useState<AssessmentResult[]>([]);
  const [externalGrades, setExternalGrades] = useState<ExternalAcademicRecord[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            // 1. Fetch Student
            const studentSnap = await getDoc(doc(db, "students", id as string));
            if (studentSnap.exists()) {
                setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
            }

            // 2. Fetch Internal Assessments
            const assessQuery = query(collection(db, "assessment_results"), where("studentId", "==", id), orderBy("completedAt", "desc"));
            const assessSnaps = await getDocs(assessQuery);
            setInternalAssessments(assessSnaps.docs.map(d => ({id: d.id, ...d.data()} as AssessmentResult)));

            // 3. Fetch External Grades (Simulated for now if collection empty)
            // const gradesQuery = query(collection(db, "external_academic_records"), where("studentId", "==", id));
            // const gradeSnaps = await getDocs(gradesQuery);
            // setExternalGrades(gradeSnaps.docs.map(d => ({id: d.id, ...d.data()} as ExternalAcademicRecord)));
            
            // Mock External Data for Demo
            setExternalGrades([
                { id: '1', studentId: id as string, subject: 'Math', grade: 85, date: '2023-09-01', term: 'Fall', sourceSystem: 'Canvas' },
                { id: '2', studentId: id as string, subject: 'Math', grade: 78, date: '2023-10-01', term: 'Fall', sourceSystem: 'Canvas' },
                { id: '3', studentId: id as string, subject: 'Math', grade: 72, date: '2023-11-01', term: 'Fall', sourceSystem: 'Canvas' }, // Dropping trend
                { id: '4', studentId: id as string, subject: 'Science', grade: 88, date: '2023-10-15', term: 'Fall', sourceSystem: 'Canvas' },
            ]);

            // 4. Fetch Cases
            const caseQuery = query(collection(db, "cases"), where("studentId", "==", id));
            const caseSnaps = await getDocs(caseQuery);
            setCases(caseSnaps.docs.map(d => ({id: d.id, ...d.data()} as Case)));

        } catch (e) {
            console.error("Error fetching 360 data", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  if (loading || !student) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Chart Data Preparation
  const radarData = [
      { subject: 'Math', A: 78, fullMark: 100 },
      { subject: 'Science', A: 88, fullMark: 100 },
      { subject: 'English', A: 65, fullMark: 100 }, // Weakness
      { subject: 'Behavior', A: 90, fullMark: 100 },
      { subject: 'Social', A: 70, fullMark: 100 },
  ];

  const trendData = externalGrades
    .filter(g => g.subject === 'Math')
    .map(g => ({ date: new Date(g.date).toLocaleDateString(), score: g.grade }));

  return (
    <div className="space-y-8 p-8 pt-6">
        {/* Header Profile */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{student.firstName} {student.lastName}</h1>
                    <Badge variant="outline" className="text-sm">Grade 5</Badge>
                    {cases.length > 0 && <Badge className="bg-purple-600">Active Case</Badge>}
                </div>
                <p className="text-muted-foreground">Student ID: {student.id} • DOB: {student.dateOfBirth}</p>
                <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" /> 92% Attendance
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" /> 3 Behavioral Incidents
                    </div>
                </div>
            </div>
        </div>

        {/* AI Correlation Alert */}
        <Alert variant="destructive" className="bg-red-50 border-red-200">
            <BrainCircuit className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">AI Pattern Detected</AlertTitle>
            <AlertDescription className="text-red-600">
                Correlation found: Drop in Math scores (Sept-Nov) coincides with 3 recorded absences and 1 behavioral incident in October.
            </AlertDescription>
        </Alert>

        {/* 360 Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Academic Performance (External) */}
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Academic Trajectory</CardTitle>
                    <CardDescription>Grades imported from Canvas/SIS.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 2. Holistic Competency (Radar) */}
            <Card>
                <CardHeader>
                    <CardTitle>Competency Radar</CardTitle>
                    <CardDescription>Holistic view of strengths/weaknesses.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis />
                            <Radar name="Student" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList>
                <TabsTrigger value="timeline">Unified Timeline</TabsTrigger>
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
                <TabsTrigger value="interventions">Interventions</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
                <Card>
                    <CardHeader>
                        <CardTitle>Activity History</CardTitle>
                        <CardDescription>Chronological events across all systems.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock Unified Timeline */}
                            <div className="flex gap-4">
                                <div className="mt-1"><AlertTriangle className="h-5 w-5 text-orange-500" /></div>
                                <div>
                                    <p className="font-medium">Behavioral Incident Report</p>
                                    <p className="text-sm text-muted-foreground">Oct 25, 2023 • Disruptive in class</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><TrendingDown className="h-5 w-5 text-red-500" /></div>
                                <div>
                                    <p className="font-medium">Math Grade Alert</p>
                                    <p className="text-sm text-muted-foreground">Oct 20, 2023 • Score dropped to 72%</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><Clock className="h-5 w-5 text-blue-500" /></div>
                                <div>
                                    <p className="font-medium">Late Arrival</p>
                                    <p className="text-sm text-muted-foreground">Oct 18, 2023 • 15 mins late</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
