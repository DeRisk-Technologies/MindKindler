import React from 'react';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Simplified Summary Interface for List View
export interface CaseSummary {
    id: string;
    studentName: string;
    upn: string;
    status: 'intake' | 'assessment' | 'drafting' | 'consultation' | 'final';
    currentWeek: number; // 0-20
    isOverdue: boolean;
    nextAction: string;
}

interface ActiveCaseListProps {
    cases: CaseSummary[];
}

export function ActiveCaseList({ cases }: ActiveCaseListProps) {
    const router = useRouter();

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Active Caseload</h2>
                <Button onClick={() => router.push('/dashboard/new')}>
                    New Intake +
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 w-1/3">Timeline (20 Weeks)</th>
                            <th className="px-6 py-4">Next Action</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cases.map((c) => (
                            <tr 
                                key={c.id} 
                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/dashboard/case/${c.id}`)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{c.studentName}</span>
                                        <span className="text-xs text-gray-400 font-mono">{c.upn}</span>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <Badge variant={c.isOverdue ? "destructive" : "outline"} className="capitalize">
                                        {c.status}
                                    </Badge>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Week {c.currentWeek}</span>
                                            {c.isOverdue && <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> BREACH</span>}
                                        </div>
                                        <Progress 
                                            value={(c.currentWeek / 20) * 100} 
                                            className={c.isOverdue ? "bg-red-100 [&>div]:bg-red-500" : "bg-blue-100 [&>div]:bg-blue-500"} 
                                        />
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {c.nextAction}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
