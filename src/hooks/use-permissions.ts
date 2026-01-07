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

    // Fetch extra user details (verification) if not in auth object
    useEffect(() => {
        if (!user) return;
        async function checkVerification() {
            // In a real app, this should be a custom claim in the token for speed
            // For MVP, we fetch the doc
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                    const data = snap.data() as StaffProfile;
                    setVerificationStatus(data.verification?.status || 'unverified');
                }
            } catch (e) {
                console.error(e);
            }
        }
        checkVerification();
    }, [user]);

    /**
     * Checks if the current user has the specified permission.
     * Includes TRUST ENGINE check for sensitive actions.
     */
    const can = (action: PermissionAction): boolean => {
        if (!user || !user.role) return false;

        const userRole = user.role as Role;
        const allowedActions = RBAC_MATRIX[userRole];
        
        if (!allowedActions || !allowedActions.includes(action)) return false;

        // TRUST ENGINE GATEKEEPER
        // If action is sensitive (clinical notes or psychometrics), require HCPC Verification
        const sensitiveActions: PermissionAction[] = ['view_sensitive_notes', 'write_psychometrics', 'view_student_pii'];
        
        if (sensitiveActions.includes(action)) {
            // If role is EPP, they MUST be verified
            if (userRole === 'EPP' || userRole === 'EducationalPsychologist') {
                if (verificationStatus !== 'verified') return false;
            }
        }

        return true;
    };

    const hasRole = (roles: Role[]): boolean => {
        if (!user || !user.role) return false;
        return roles.includes(user.role as Role);
    }

    return { can, hasRole, user, verificationStatus };
}
