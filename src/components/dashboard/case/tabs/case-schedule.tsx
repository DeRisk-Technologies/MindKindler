// src/components/dashboard/case/tabs/case-schedule.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, Plus, Clock } from 'lucide-react';
import { CaseFile, WorkTask } from '@/types/case';

export function CaseSchedule({ caseFile }: { caseFile: CaseFile }) {
    // Mock tasks if undefined
    const tasks = caseFile.workSchedule || [
        { id: '1', title: 'Review Initial Request', type: 'admin', status: 'done' },
        { id: '2', title: 'Contact Parent (Introduction)', type: 'consultation', status: 'pending' },
        { id: '3', title: 'School Observation', type: 'observation', status: 'scheduled', dueDate: '2026-02-15' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Engagement Plan</h3>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">To-Do List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {tasks.map((task: any) => (
                                <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${task.status === 'done' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {task.status === 'done' && <CheckSquare className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">{task.type}</p>
                                    </div>
                                    {task.dueDate && (
                                        <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {task.dueDate}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar View (Mini) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Calendar className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No appointments scheduled</p>
                            <Button variant="link" className="text-indigo-600">Open Calendar</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
