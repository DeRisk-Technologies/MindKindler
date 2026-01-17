// src/components/dashboard/case/tabs/case-schedule.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, Plus, Clock, Loader2, Trash2 } from 'lucide-react';
import { CaseFile, WorkTask } from '@/types/case';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function CaseSchedule({ caseFile }: { caseFile: CaseFile }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<WorkTask[]>(caseFile.workSchedule || []);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<WorkTask>>({ title: '', type: 'admin', status: 'pending' });
    const [loading, setLoading] = useState(false);

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
                dueDate: newTask.dueDate
            };

            const updatedTasks = [...tasks, task];
            
            await updateDoc(doc(db, 'cases', caseFile.id), {
                workSchedule: updatedTasks
            });

            setTasks(updatedTasks);
            setIsAddOpen(false);
            setNewTask({ title: '', type: 'admin', status: 'pending' });

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
                <h3 className="text-lg font-semibold">Engagement Plan</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newTask.type} onValueChange={v => setNewTask({...newTask, type: v as any})}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="consultation">Consultation</SelectItem>
                                            <SelectItem value="observation">Observation</SelectItem>
                                            <SelectItem value="drafting">Drafting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleAddTask} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create Task
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">To-Do List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasks.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No tasks scheduled.</p>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map((task: WorkTask) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                                        <div 
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${task.status === 'done' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
                                        >
                                            {task.status === 'done' && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1 capitalize">{task.type}</Badge>
                                                {task.linkedAppointmentId && <Badge variant="outline" className="text-[10px] h-5 px-1 bg-blue-50 text-blue-700 border-blue-200">Linked Event</Badge>}
                                            </div>
                                        </div>
                                        {task.dueDate && (
                                            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                            </div>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-slate-400 hover:text-red-500"
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
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                            <Calendar className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">View Full Calendar</p>
                            <Button variant="link" className="text-indigo-600">Open</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
