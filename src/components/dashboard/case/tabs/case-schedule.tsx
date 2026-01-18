// src/components/dashboard/case/tabs/case-schedule.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, Plus, Clock, Loader2, Trash2, ListChecks, ChevronRight } from 'lucide-react';
import { CaseFile, WorkTask } from '@/types/case';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface Appointment {
    id: string;
    title: string;
    start: Date | Timestamp | string;
    end: Date | Timestamp | string;
    type: string;
}

export function CaseSchedule({ caseFile }: { caseFile: CaseFile }) {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<WorkTask[]>(caseFile.workSchedule || []);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Add Task State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<WorkTask> & { notes?: string }>({ 
        title: '', 
        type: 'admin', 
        status: 'pending',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [apptLoading, setApptLoading] = useState(false);

    // Fetch Appointments related to this case or student
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user || !caseFile.studentId) return;
            setApptLoading(true);
            try {
                const db = getRegionalDb(user.region || 'uk');
                const q = query(
                    collection(db, 'appointments'),
                    where('studentId', '==', caseFile.studentId),
                    where('start', '>=', new Date().toISOString()) // Only future
                );
                
                const snap = await getDocs(q);
                const appts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
                
                // Sort by date
                appts.sort((a, b) => {
                    const dateA = new Date(typeof a.start === 'string' ? a.start : (a.start as any).toDate());
                    const dateB = new Date(typeof b.start === 'string' ? b.start : (b.start as any).toDate());
                    return dateA.getTime() - dateB.getTime();
                });

                setAppointments(appts);
            } catch (e) {
                console.error("Failed to fetch appointments:", e);
            } finally {
                setApptLoading(false);
            }
        };

        fetchAppointments();
    }, [user, caseFile.studentId]);

    const handleAddTask = async () => {
        if (!user || !newTask.title) return;
        setLoading(true);
        try {
            const db = getRegionalDb(user.region || 'uk');
            const task: WorkTask = {
                id: `t-${Date.now()}`,
                title: newTask.title,
                type: newTask.type as any,
                status: 'pending',
                dueDate: newTask.dueDate,
                // @ts-ignore: Assuming we extend the type or use metadata field
                notes: newTask.notes
            };

            const updatedTasks = [...tasks, task];
            
            await updateDoc(doc(db, 'cases', caseFile.id), {
                workSchedule: updatedTasks
            });

            setTasks(updatedTasks);
            setIsAddOpen(false);
            setNewTask({ title: '', type: 'admin', status: 'pending', notes: '' });

        } catch (e) {
            console.error("Failed to add task", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId: string) => {
        if (!user) return;
        try {
            const db = getRegionalDb(user.region || 'uk');
            const updatedTasks = tasks.map(t => 
                t.id === taskId ? { ...t, status: (t.status === 'done' ? 'pending' : 'done') as any } : t
            );
            
            await updateDoc(doc(db, 'cases', caseFile.id), {
                workSchedule: updatedTasks
            });
            setTasks(updatedTasks);
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!user) return;
        try {
            const db = getRegionalDb(user.region || 'uk');
            const updatedTasks = tasks.filter(t => t.id !== taskId);
            
            await updateDoc(doc(db, 'cases', caseFile.id), {
                workSchedule: updatedTasks
            });
            setTasks(updatedTasks);
        } catch (e) {
            console.error("Failed to delete task", e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-indigo-600"/>
                    Engagement Plan
                </h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>New Engagement Task</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Task Title</Label>
                                <Input 
                                    placeholder="e.g. Complete Initial Observation"
                                    value={newTask.title} 
                                    onChange={e => setNewTask({...newTask, title: e.target.value})} 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea 
                                    placeholder="Add details, sub-tasks, or requirements..."
                                    className="resize-none"
                                    value={newTask.notes}
                                    onChange={e => setNewTask({...newTask, notes: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={newTask.type} onValueChange={v => setNewTask({...newTask, type: v as any})}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="consultation">Consultation</SelectItem>
                                            <SelectItem value="observation">Observation</SelectItem>
                                            <SelectItem value="drafting">Drafting</SelectItem>
                                            <SelectItem value="review">Review</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleAddTask} disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create Task
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task List */}
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">To-Do List</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                                <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                                No tasks scheduled yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map((task: WorkTask) => (
                                    <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors group bg-white shadow-sm">
                                        <div className="pt-1">
                                            <div 
                                                onClick={() => handleToggleTask(task.id)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${task.status === 'done' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
                                            >
                                                {task.status === 'done' && <CheckSquare className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.title}
                                            </p>
                                            {(task as any).notes && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {(task as any).notes}
                                                </p>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize font-normal bg-slate-100 text-slate-600 border-slate-200">{task.type}</Badge>
                                                {task.linkedAppointmentId && <Badge variant="outline" className="text-[10px] h-5 px-1 bg-blue-50 text-blue-700 border-blue-200">Linked Event</Badge>}
                                                {task.dueDate && (
                                                    <div className={`flex items-center text-[10px] px-1.5 rounded ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-slate-400 hover:text-red-500 -mt-1 -mr-1"
                                            onClick={() => handleDeleteTask(task.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Calendar View (Mini) */}
                <Card className="h-full flex flex-col border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-indigo-900 uppercase tracking-wider">Upcoming Events</CardTitle>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-600 hover:text-indigo-800" onClick={() => router.push('/dashboard/appointments/calendar')}>
                            View Calendar <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {apptLoading ? (
                             <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400"/></div>
                        ) : appointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-indigo-300 text-sm">
                                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                                No upcoming appointments found.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {appointments.slice(0, 5).map(appt => {
                                    const start = new Date(typeof appt.start === 'string' ? appt.start : (appt.start as any).toDate());
                                    return (
                                        <div key={appt.id} className="flex gap-3 items-center bg-white p-2.5 rounded-md border border-indigo-100 shadow-sm">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 rounded text-indigo-700 font-bold leading-none">
                                                <span className="text-xs uppercase">{start.toLocaleDateString(undefined, {month:'short'})}</span>
                                                <span className="text-lg">{start.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-indigo-950">{appt.title}</p>
                                                <div className="flex items-center text-xs text-indigo-500 mt-0.5">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {start.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'})}
                                                    <span className="mx-1">•</span>
                                                    <span className="capitalize">{appt.type || 'Meeting'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
