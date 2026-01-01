"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student, AssessmentResult, ExternalAcademicRecord, AttendanceRecord, Case, AssessmentTemplate } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, TrendingDown, BookOpen, Clock, Activity, BrainCircuit, FileText, ChevronRight, GitCompare } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ConsentTab } from "@/components/dashboard/students/consent-tab";
import InterventionList from "@/components/dashboard/students/intervention-list";
import { Student360Main } from "@/components/student360/Student360Main";

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data Buckets
  const [internalAssessments, setInternalAssessments] = useState<AssessmentResult[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<Record<string, AssessmentTemplate>>({}); // Cache for titles
  const [externalGrades, setExternalGrades] = useState<ExternalAcademicRecord[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Comparison State
  const [compareList, setCompareList] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchData() {
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
            const results = assessSnaps.docs.map(d => ({id: d.id, ...d.data()} as AssessmentResult));
            setInternalAssessments(results);

            // Fetch template names for display
            const templateIds = Array.from(new Set(results.map(r => r.templateId)));
            const templateMap: Record<string, AssessmentTemplate> = {};
            for (const tId of templateIds) {
                const tSnap = await getDoc(doc(db, "assessment_templates", tId));
                if (tSnap.exists()) {
                    templateMap[tId] = tSnap.data() as AssessmentTemplate;
                }
            }
            setAssessmentTemplates(templateMap);

            // 3. Mock External Data for Demo
            setExternalGrades([
                { id: '1', studentId: id as string, subject: 'Math', grade: 85, date: '2023-09-01', term: 'Fall', sourceSystem: 'Canvas' },
                { id: '2', studentId: id as string, subject: 'Math', grade: 78, date: '2023-10-01', term: 'Fall', sourceSystem: 'Canvas' },
                { id: '3', studentId: id as string, subject: 'Math', grade: 72, date: '2023-11-01', term: 'Fall', sourceSystem: 'Canvas' }, 
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

  const toggleCompare = (resultId: string) => {
      setCompareList(prev => {
          if (prev.includes(resultId)) return prev.filter(p => p !== resultId);
          if (prev.length >= 2) return [prev[1], resultId]; // Keep max 2 recent
          return [...prev, resultId];
      });
  };

  const getComparisonData = () => {
      if (compareList.length < 2) return null;
      const r1 = internalAssessments.find(r => r.id === compareList[0]);
      const r2 = internalAssessments.find(r => r.id === compareList[1]);
      if (!r1 || !r2) return null;

      // Ensure chronological order
      // Safe date parsing: use 0 timestamp fallback for sorting if undefined
      const getTime = (d?: string) => d ? new Date(d).getTime() : 0;
      const sorted = [r1, r2].sort((a, b) => getTime(a.completedAt) - getTime(b.completedAt));
      
      const scoreDiff = sorted[1].totalScore - sorted[0].totalScore;

      return {
          prev: sorted[0],
          curr: sorted[1],
          diff: scoreDiff
      };
  };

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
        
        {/* New: Student 360 Main Component (Alerts, Quick Actions, Evidence) */}
        <Student360Main studentId={id as string} tenantId={student.tenantId || "global"} />

        {/* Existing: Detailed Academic & Assessment Data */}
        <Tabs defaultValue="assessments" className="space-y-4">
            <TabsList>
                <TabsTrigger value="assessments">Assessment History</TabsTrigger>
                <TabsTrigger value="interventions">Interventions</TabsTrigger>
                <TabsTrigger value="charts">Academic Trends</TabsTrigger>
                <TabsTrigger value="consent">Consent & Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="assessments">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Completed Assessments</CardTitle>
                            <CardDescription>History of evaluations and screening results.</CardDescription>
                        </div>
                        {compareList.length === 2 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <GitCompare className="mr-2 h-4 w-4" /> Compare Selected ({compareList.length})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Assessment Comparison</DialogTitle>
                                    </DialogHeader>
                                    {getComparisonData() && (
                                        <div className="grid grid-cols-2 gap-8 pt-4">
                                            <div className="space-y-2 border-r pr-4">
                                                <h4 className="font-bold text-muted-foreground text-sm uppercase">Previous</h4>
                                                <div className="text-lg font-semibold">{assessmentTemplates[getComparisonData()?.prev.templateId || ""]?.title}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(getComparisonData()?.prev.completedAt || "").toLocaleDateString()}</div>
                                                <div className="text-3xl font-bold mt-4">{getComparisonData()?.prev.totalScore}</div>
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{getComparisonData()?.prev.aiAnalysis}</p>
                                            </div>
                                            <div className="space-y-2 pl-4">
                                                <h4 className="font-bold text-muted-foreground text-sm uppercase">Recent</h4>
                                                <div className="text-lg font-semibold">{assessmentTemplates[getComparisonData()?.curr.templateId || ""]?.title}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(getComparisonData()?.curr.completedAt || "").toLocaleDateString()}</div>
                                                <div className="flex items-center gap-2 mt-4">
                                                    <div className="text-3xl font-bold">{getComparisonData()?.curr.totalScore}</div>
                                                    <Badge className={getComparisonData()?.diff! > 0 ? "bg-green-600" : "bg-red-600"}>
                                                        {getComparisonData()?.diff! > 0 ? "+" : ""}{getComparisonData()?.diff} pts
                                                    </Badge>
                                                </div>
                                                 <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{getComparisonData()?.curr.aiAnalysis}</p>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Compare</TableHead>
                                    <TableHead>Assessment Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {internalAssessments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No assessments found.</TableCell>
                                    </TableRow>
                                ) : (
                                    internalAssessments.map(res => (
                                        <TableRow key={res.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={compareList.includes(res.id)}
                                                    onCheckedChange={() => toggleCompare(res.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                {assessmentTemplates[res.templateId]?.title || "Untitled Assessment"}
                                            </TableCell>
                                            <TableCell>{res.completedAt ? new Date(res.completedAt).toLocaleDateString() : (res.startedAt ? new Date(res.startedAt).toLocaleDateString() : 'N/A')}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{res.totalScore} / {res.maxScore}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={res.status === 'graded' ? 'bg-green-600' : 'bg-yellow-600'}>
                                                    {res.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/assessments/results/${res.id}`)}>
                                                    View Results <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="charts">
                 {/* 360 Dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
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
            </TabsContent>

            <TabsContent value="consent">
                <ConsentTab studentId={id as string} />
            </TabsContent>

            <TabsContent value="interventions">
                <InterventionList studentId={id as string} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
