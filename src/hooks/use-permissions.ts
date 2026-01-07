// src/hooks/use-permissions.ts

import { useAuth } from "@/hooks/use-auth";
import { RBAC_MATRIX, PermissionAction } from "@/config/permissions";
import { Role, StaffProfile } from "@/types/schema";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePermissions() {
    const { user } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'unverified' | 'rejected'>('unverified');
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch extra user details (verification & role) if not in auth object
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        async function loadProfile() {
            // Re-check user existence to satisfy TS inside async closure
            if (!user) return; 

            try {
                // 1. Try to get role from ID Token (Fastest, if custom claims set)
                const token = await user.getIdTokenResult();
                if (token?.claims?.role) {
                    setUserRole(token.claims.role as Role);
                }

                // 2. Fetch Firestore Profile (Authoritative source for verification status)
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                    const data = snap.data() as StaffProfile;
                    setVerificationStatus(data.verification?.status || 'unverified');
                    
                    // Fallback: If no custom claim, use DB role
                    if (!token?.claims?.role && data.role) {
                        setUserRole(data.role as Role);
                    }
                }
            } catch (e) {
                console.error("Permission Load Error", e);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [user]);

    /**
     * Checks if the current user has the specified permission.
     * Includes TRUST ENGINE check for sensitive actions.
     */
    const can = (action: PermissionAction): boolean => {
        if (!user || !userRole) return false;

        const allowedActions = RBAC_MATRIX[userRole];
        
        if (!allowedActions || !allowedActions.includes(action)) return false;

        // TRUST ENGINE GATEKEEPER
        // If action is sensitive (clinical notes or psychometrics), require HCPC Verification
        const sensitiveActions: PermissionAction[] = ['view_sensitive_notes', 'write_psychometrics', 'view_student_pii'];
        
        if (sensitiveActions.includes(action)) {
            // If role is EPP, they MUST be verified
            // Note: We check against the string literal directly or the Role type
            if (userRole === 'EPP' || (userRole as string) === 'EducationalPsychologist') {
                if (verificationStatus !== 'verified') return false;
            }
        }

        return true;
    };

    const hasRole = (roles: (Role | string)[]): boolean => {
        if (!user || !userRole) return false;
        return roles.includes(userRole);
    }

    return { can, hasRole, user, verificationStatus, loading, role: userRole };
}
