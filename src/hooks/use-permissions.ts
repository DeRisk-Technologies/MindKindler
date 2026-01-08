// src/hooks/use-permissions.ts

import { useAuth } from "@/hooks/use-auth";
import { RBAC_MATRIX, PermissionAction } from "@/config/permissions";
import { Role, StaffProfile } from "@/types/schema";
import { useEffect, useState } from "react";
import { doc, getDoc, Firestore } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase";

// Normalizes various naming conventions to the central RBAC Role type
const normalizeRole = (role: string | undefined): Role | null => {
    if (!role) return null;
    const r = role.toLowerCase().replace(/\s/g, '');
    if (r === 'epp' || r === 'educationalpsychologist' || r === 'clinicalpsychologist') return 'EPP';
    if (r === 'superadmin' || r === 'admin') return 'SuperAdmin';
    if (r === 'tenantadmin') return 'TenantAdmin';
    if (r === 'schooladmin' || r === 'schooladministrator') return 'SchoolAdmin';
    if (r === 'teacher') return 'Teacher';
    if (r === 'parent' || r === 'parentuser') return 'ParentUser';
    if (r === 'assistant') return 'Assistant';
    if (r === 'trustedassistant') return 'TrustedAssistant';
    if (r === 'govanalyst') return 'GovAnalyst';
    return role as Role;
};

export function usePermissions() {
    const { user, loading: authLoading } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'unverified' | 'rejected'>('unverified');
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [shardId, setShardId] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { 
            setLoading(false); 
            setUserRole(null);
            return; 
        }

        async function fetchPermissions() {
            try {
                // 1. Check Routing
                const routingSnap = await getDoc(doc(db, 'user_routing', user!.uid));
                const region = routingSnap.exists() ? routingSnap.data().region : 'default';
                const targetDb = getRegionalDb(region);
                
                if (routingSnap.exists() && routingSnap.data().shardId) {
                    setShardId(routingSnap.data().shardId);
                }

                // 2. Load Profile from Shard
                const profileSnap = await getDoc(doc(targetDb, 'users', user!.uid));
                if (profileSnap.exists()) {
                    const data = profileSnap.data() as StaffProfile;
                    setVerificationStatus(data.verification?.status || 'unverified');
                    setUserRole(normalizeRole(data.role));
                }
            } catch (e) {
                console.error("RBAC Failure", e);
            } finally {
                setLoading(false);
            }
        }
        fetchPermissions();
    }, [user, authLoading]);

    const can = (action: PermissionAction): boolean => {
        if (loading || !userRole) return false;

        const allowedActions = RBAC_MATRIX[userRole];
        if (!allowedActions || !allowedActions.includes(action)) return false;

        // Trust Engine Gatekeeper
        const sensitiveActions: PermissionAction[] = ['view_sensitive_notes', 'write_psychometrics', 'view_student_pii'];
        if (sensitiveActions.includes(action)) {
            if (userRole === 'EPP') {
                if (verificationStatus !== 'verified') return false;
            }
        }
        return true;
    };

    /**
     * Checks if the user has any of the specified roles.
     * Use this for broad UI layout logic.
     */
    const hasRole = (roles: (Role | string)[]): boolean => {
        if (loading || !userRole) return false;
        // Check normalized role against allowed list
        return roles.includes(userRole);
    };

    return { 
        can, 
        hasRole, // Restored
        user, 
        role: userRole, 
        verificationStatus, 
        loading,
        shardId 
    };
}
