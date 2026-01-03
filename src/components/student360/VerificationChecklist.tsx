import React from 'react';
import { VerificationTask } from '@/types/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VerificationChecklistProps {
  tasks: VerificationTask[];
  onVerify: (taskId: string) => void;
  onViewDetails: (taskId: string) => void;
}

export function VerificationChecklist({ tasks, onVerify, onViewDetails }: VerificationChecklistProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'verified');

  if (tasks.length === 0) {
      return (
          <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-6 text-center text-gray-500 text-sm">
                  No verification tasks pending.
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Verification Checklist
            </CardTitle>
            <span className="text-xs font-medium text-gray-500">{completedTasks.length}/{tasks.length} Done</span>
        </div>
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
            />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {pendingTasks.map(task => (
            <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-all">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{task.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Due {task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : 'ASAP'}</span>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onViewDetails(task.id)}
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        ))}

        {completedTasks.length > 0 && (
            <div className="pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Completed</p>
                <div className="space-y-2 opacity-60">
                     {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-sm text-gray-600">
                             <CheckCircle2 className="h-3 w-3 text-green-600" />
                             <span className="line-through">{task.description}</span>
                        </div>
                     ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
