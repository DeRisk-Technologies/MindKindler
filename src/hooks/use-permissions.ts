// src/hooks/use-permissions.ts

import { useAuth } from "@/hooks/use-auth";
import { RBAC_MATRIX, PermissionAction } from "@/config/permissions";
import { Role } from "@/types/schema";

export function usePermissions() {
    const { user } = useAuth();

    /**
     * Checks if the current user has the specified permission.
     * @param action The capability to check (e.g., 'view_staff_scr')
     */
    const can = (action: PermissionAction): boolean => {
        if (!user || !user.role) return false;

        // Normalize role string just in case
        const userRole = user.role as Role;
        
        // 1. Check if role exists in Matrix
        const allowedActions = RBAC_MATRIX[userRole];
        if (!allowedActions) return false;

        // 2. Check if action is in the allowed list
        return allowedActions.includes(action);
    };

    /**
     * Returns true if user role matches one of the allowed roles.
     * Simpler than capability check for broad access control.
     */
    const hasRole = (roles: Role[]): boolean => {
        if (!user || !user.role) return false;
        return roles.includes(user.role as Role);
    }

    return { can, hasRole, user };
}
