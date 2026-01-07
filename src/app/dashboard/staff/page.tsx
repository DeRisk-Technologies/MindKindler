// src/app/dashboard/staff/page.tsx

"use client";

import React from 'react';
import { SingleCentralRecordTable } from '@/components/staff/SingleCentralRecordTable';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function StaffSCRPage() {
    return (
        <RouteGuard>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Staff Vetting</h1>
                        <p className="text-muted-foreground">Manage the Single Central Record (SCR) for statutory compliance.</p>
                    </div>
                    <Link href="/dashboard/staff/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Staff Member
                        </Button>
                    </Link>
                </div>

                <SingleCentralRecordTable />
            </div>
        </RouteGuard>
    );
}
