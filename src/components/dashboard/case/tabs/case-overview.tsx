"use client";

import { useEffect, useState } from "react";
import { Case } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Users, Activity, AlertTriangle, FileText, CheckCircle, NotebookPen, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getRegionalDb } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface CaseOverviewProps {
  caseData: Case;
}

export function CaseOverview({ caseData }: CaseOverviewProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [note, setNote] = useState("");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerEvent, setPlannerEvent] = useState({ title: '', date: '' });
  const [stats, setStats] = useState({ consultations: 0, reports: 0, assessments: 0 });

  useEffect(() => {
      if(!user || !caseData.studentId) return;
      
      async function loadStudent() {
          try {
              const db = getRegionalDb(user?.region);
              
              // Load Student
              const stuSnap = await getDoc(doc(db, 'students', caseData.studentId));
              if(stuSnap.exists()) setStudent(stuSnap.data());

              // Load Stats
              const consults = await getDocs(query(collection(db, 'consultation_sessions'), where('studentId', '==', caseData.studentId)));
              const reports = await getDocs(query(collection(db, 'reports'), where('studentId', '==', caseData.studentId)));
              const assess = await getDocs(query(collection(db, 'assessment_results'), where('studentId', '==', caseData.studentId)));

              setStats({
                  consultations: consults.size,
                  reports: reports.size,
                  assessments: assess.size
              });

          } catch(e) { console.error(e); }
      }
      loadStudent();
  }, [user, caseData.studentId]);

  const handleAddNote = async () => {
      if(!note || !user) return;
      try {
          const db = getRegionalDb(user.region);
          // Add as activity
          await updateDoc(doc(db, 'cases', caseData.id), {
              activities: arrayUnion({
                  date: new Date().toISOString(),
                  summary: "Note Added: " + note,
                  performedBy: user.uid,
                  type: 'note'
              })
          });
          setNote("");
      } catch(e) { console.error(e); }
  };

  const handleAddPlan = async () => {
      // Phase 36: Planner Logic Placeholder
      // In a full implementation, this saves to a 'planner' subcollection or appointments
      setPlannerOpen(false);
  };

  if(!student) return <div>Loading context...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <div className="col-span-4 space-y-4">
        {/* Student/Subject Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.identity?.photoUrl} alt={student.identity?.firstName?.value} />
              <AvatarFallback>{student.identity?.firstName?.value?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{student.identity?.firstName?.value} {student.identity?.lastName?.value}</CardTitle>
              <CardDescription>{student.education?.yearGroup?.value || "Year Group Unknown"} • {student.education?.currentSchoolId?.value ? "School Linked" : "No School Linked"}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {student.education?.senStatus?.value && <Badge variant="secondary">{student.education.senStatus.value}</Badge>}
                {student.health?.conditions?.value?.map((c: string) => <Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-center">
                 <div className="p-2 bg-slate-50 rounded">
                     <div className="font-bold text-lg">{stats.consultations}</div>
                     <div className="text-xs text-muted-foreground">Sessions</div>
                 </div>
                 <div className="p-2 bg-slate-50 rounded">
                     <div className="font-bold text-lg">{stats.assessments}</div>
                     <div className="text-xs text-muted-foreground">Assessments</div>
                 </div>
                 <div className="p-2 bg-slate-50 rounded">
                     <div className="font-bold text-lg">{stats.reports}</div>
                     <div className="text-xs text-muted-foreground">Reports</div>
                 </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Case Focus</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {caseData.description || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Note Taker */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center"><NotebookPen className="h-4 w-4"/> Quick Note</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Textarea 
                        placeholder="Log a quick observation, phone call, or thought..." 
                        className="min-h-[80px]"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </div>
                <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={handleAddNote} disabled={!note}>Save Note</Button>
                </div>
            </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Case Timeline</CardTitle>
            <CardDescription>Chronological log of all interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {caseData.activities?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((activity, index) => (
                <div key={index} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="relative z-10 flex h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                    {index !== (caseData.activities.length - 1) && (
                      <div className="h-full w-[2px] bg-slate-200 absolute top-3" />
                    )}
                  </div>
                  <div className="space-y-1 pb-2">
                    <p className="text-sm font-medium leading-none">{activity.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleString()} • {activity.type || 'System'}
                    </p>
                  </div>
                </div>
              ))}
              {!caseData.activities?.length && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-3 space-y-4">
        {/* Next Actions Planner */}
        <Card className="bg-indigo-50 border-indigo-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-indigo-900 text-sm font-bold flex justify-between items-center">
                    <span><Calendar className="inline mr-2 h-4 w-4"/> Case Planner</span>
                    <Button size="sm" variant="ghost" onClick={() => setPlannerOpen(true)}><Activity className="h-4 w-4"/></Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* Mock Future Events */}
                    <div className="flex gap-3 items-center bg-white p-2 rounded border shadow-sm">
                        <div className="bg-red-100 text-red-700 text-xs font-bold p-1 rounded text-center min-w-[40px]">
                            14<br/>JAN
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold">Parent Consultation</div>
                            <div className="text-xs text-muted-foreground">10:00 AM - Zoom</div>
                        </div>
                    </div>
                     <div className="flex gap-3 items-center bg-white p-2 rounded border shadow-sm">
                        <div className="bg-blue-100 text-blue-700 text-xs font-bold p-1 rounded text-center min-w-[40px]">
                            20<br/>JAN
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold">School Visit</div>
                            <div className="text-xs text-muted-foreground">09:00 AM - On Site</div>
                        </div>
                    </div>
                </div>
                
                <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add to Planner</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Event Title" value={plannerEvent.title} onChange={e => setPlannerEvent({...plannerEvent, title: e.target.value})}/>
                            <Input type="date" value={plannerEvent.date} onChange={e => setPlannerEvent({...plannerEvent, date: e.target.value})}/>
                        </div>
                         <Button onClick={handleAddPlan}>Add to Schedule</Button>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>

        {/* Key Metrics / Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 high priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">On Track</div>
              <p className="text-xs text-muted-foreground">12 days remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="w-full justify-start" variant="secondary">
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <Activity className="mr-2 h-4 w-4" /> Log Intervention
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <AlertTriangle className="mr-2 h-4 w-4" /> Report Incident
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
