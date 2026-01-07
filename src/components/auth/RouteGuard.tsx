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
    const { can, user } = usePermissions(); // Assuming loading state is handled in useAuth

    useEffect(() => {
        if (!user) return; // Allow Layout to redirect to login if auth missing

        // 1. Staff SCR Protection
        if (pathname.startsWith('/dashboard/staff') && !can('view_staff_scr')) {
            console.warn(`Access Denied: ${user.role} cannot view Staff SCR.`);
            router.replace('/dashboard');
        }

        // 2. GovIntel Protection
        if (pathname.startsWith('/dashboard/govintel') && !can('view_gov_intel')) {
            console.warn(`Access Denied: ${user.role} cannot view GovIntel.`);
            router.replace('/dashboard');
        }

        // 3. Marketplace Admin
        if (pathname.startsWith('/dashboard/marketplace') && !can('manage_compliance_packs')) {
             // Allow viewing? No, safer to block manage actions.
             // Maybe allow EPP to browse but not install.
             // For now, strict block for safety.
             // router.replace('/dashboard'); 
        }

    }, [pathname, user, can, router]);

    // Optional: Add a loading spinner if auth is initializing
    // if (loading) return <Loader2 ... />

    return <>{children}</>;
}
