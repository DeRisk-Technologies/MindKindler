// src/app/dashboard/staff/new/page.tsx

"use client";

import React from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { StaffEntryForm } from '@/components/staff/StaffEntryForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewStaffPage() {
    const router = useRouter();

    return (
        <RouteGuard>
            <div className="p-8 space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Register
                </Button>
                
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Staff Entry</h1>
                    <p className="text-muted-foreground">Add a new employee or volunteer to the SCR.</p>
                </div>

                <StaffEntryForm />
            </div>
        </RouteGuard>
    );
}
