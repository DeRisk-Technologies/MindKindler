// src/components/auth/RouteGuard.tsx

"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

export function RouteGuard({ children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const { can, user, loading } = usePermissions(); // FIX: Destructure loading

    useEffect(() => {
        // 1. If still loading permissions, do nothing yet
        if (loading) return;

        // 2. If no user, Layout usually handles redirect to login, but we can double check
        if (!user) return; 

        // 3. Staff SCR Protection
        if (pathname.startsWith('/dashboard/staff') && !can('view_staff_scr')) {
            console.warn(`Access Denied: ${user.email} (Role: ${JSON.stringify(user)}) cannot view Staff SCR.`);
            router.replace('/dashboard');
        }

        // 4. GovIntel Protection
        if (pathname.startsWith('/dashboard/govintel') && !can('view_gov_intel')) {
            console.warn(`Access Denied: cannot view GovIntel.`);
            router.replace('/dashboard');
        }

    }, [pathname, user, can, loading, router]);

    // Show spinner while checking permissions to prevent flash of content or premature redirect
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
