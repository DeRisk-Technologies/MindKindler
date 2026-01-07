// src/hooks/use-permissions.ts

import { useAuth } from "@/hooks/use-auth";
import { RBAC_MATRIX, PermissionAction } from "@/config/permissions";
import { Role, StaffProfile } from "@/types/schema";
import { useEffect, useState } from "react";
import { doc, getDoc, Firestore } from "firebase/firestore";
import { db, getRegionalDb } from "@/lib/firebase"; // Import regional loader

export function usePermissions() {
    const { user, loading: authLoading } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'unverified' | 'rejected'>('unverified');
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [shardId, setShardId] = useState<string | null>(null); // Track shard

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setUserRole(null);
            setProfileLoading(false);
            return;
        }
        
        setProfileLoading(true);
        let isMounted = true;

        async function loadProfile() {
            if (!user) return; 

            try {
                // 1. Check Routing Table (Global)
                const routingRef = doc(db, 'user_routing', user.uid);
                const routingSnap = await getDoc(routingRef);
                
                let targetDb: Firestore = db; // Default to global
                let targetShard = 'default';

                if (routingSnap.exists()) {
                    const routing = routingSnap.data();
                    if (routing.shardId) {
                        targetDb = getRegionalDb(routing.region); // e.g. 'uk'
                        targetShard = routing.shardId;
                    }
                }

                if (isMounted) setShardId(targetShard);

                // 2. Fetch Full Profile from Target DB
                const profileRef = doc(targetDb, 'users', user.uid);
                const profileSnap = await getDoc(profileRef);
                
                if (profileSnap.exists() && isMounted) {
                    const data = profileSnap.data() as StaffProfile;
                    // console.log(`[usePermissions] Profile Loaded from ${targetShard}. Role: ${data.role}`);
                    
                    setVerificationStatus(data.verification?.status || 'unverified');
                    
                    // Priority: Firestore Profile > Token Claims
                    // (Changed Logic: Profile is fresher than token if recently updated)
                    if (data.role) {
                         // Normalize role string (e.g. 'educationalpsychologist' -> 'EPP') if needed
                         // But RBAC_MATRIX handles variants now via update below?
                         // Ideally we map raw string to Enum.
                         setUserRole(mapStringToRole(data.role));
                    } else {
                         const token = await user.getIdTokenResult();
                         if (token?.claims?.role) setUserRole(token.claims.role as Role);
                    }
                } else {
                    // Fallback: Check Token Claims if profile load fails
                     const token = await user.getIdTokenResult();
                    if (token?.claims?.role) {
                         setUserRole(token.claims.role as Role);
                    }
                }

            } catch (e) {
                console.error("[usePermissions] Load Error", e);
            } finally {
                if (isMounted) setProfileLoading(false);
            }
        }

        loadProfile();

        return () => { isMounted = false; };
    }, [user, authLoading]);

    const loading = authLoading || profileLoading;

    const can = (action: PermissionAction): boolean => {
        if (loading) return false;
        if (!user || !userRole) return false;

        const allowedActions = RBAC_MATRIX[userRole];
        if (!allowedActions || !allowedActions.includes(action)) return false;

        const sensitiveActions: PermissionAction[] = ['view_sensitive_notes', 'write_psychometrics', 'view_student_pii'];
        if (sensitiveActions.includes(action)) {
            // EPPs require strict verification
            if (userRole === 'EPP' || userRole === 'EducationalPsychologist') {
                if (verificationStatus !== 'verified') return false;
            }
        }
        return true;
    };

    const hasRole = (roles: (Role | string)[]): boolean => {
        if (!user || !userRole) return false;
        return roles.includes(userRole);
    }

    return { can, hasRole, user, verificationStatus, loading, role: userRole, shardId };
}

// Helper to normalize sloppy string roles to Strict Enums
function mapStringToRole(roleStr: string): Role {
    const r = roleStr.toLowerCase();
    if (r === 'epp' || r === 'educationalpsychologist') return 'EPP';
    if (r === 'superadmin') return 'SuperAdmin';
    if (r === 'tenantadmin') return 'TenantAdmin';
    if (r === 'schooladmin') return 'SchoolAdmin';
    if (r === 'parent' || r === 'parentuser') return 'ParentUser';
    return roleStr as Role; // Fallback
}
