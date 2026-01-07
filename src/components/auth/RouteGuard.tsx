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
    const { can, hasRole, user, loading } = usePermissions();

    useEffect(() => {
        if (loading) return;
        if (!user) return; 

        // 1. Staff SCR Protection
        if (pathname.startsWith('/dashboard/staff') && !can('view_staff_scr')) {
            router.replace('/dashboard');
        }

        // 2. GovIntel Protection
        if (pathname.startsWith('/dashboard/govintel') && !can('view_gov_intel')) {
            router.replace('/dashboard');
        }

        // 3. Admin / Tenant Provisioning Protection
        // Allow EPPs (who are effectively TenantAdmins of their practice) to access provisioning tools
        // Specifically /dashboard/admin/enterprise/new
        if (pathname.startsWith('/dashboard/admin') && !hasRole(['SuperAdmin', 'TenantAdmin', 'EPP'])) {
             console.warn(`Access Denied: ${user.email} cannot view Admin Console.`);
             router.replace('/dashboard');
        }

    }, [pathname, user, can, hasRole, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
