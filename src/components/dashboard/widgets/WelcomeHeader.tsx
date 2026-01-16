// src/components/dashboard/widgets/WelcomeHeader.tsx
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export function WelcomeHeader() {
    const { user } = useAuth();
    
    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {greeting}, {user?.displayName || 'colleague'}.
                </h1>
                <p className="text-slate-500 mt-1">
                    You are logged into <span className="font-semibold text-slate-700">{user?.tenantId}</span> ({user?.region?.toUpperCase()}).
                </p>
            </div>
            <div className="flex gap-3">
                <Link href="/dashboard/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100">
                        <Plus className="w-4 h-4 mr-2" /> New Case Intake
                    </Button>
                </Link>
            </div>
        </div>
    );
}
