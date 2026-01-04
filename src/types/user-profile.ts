// src/types/user-profile.ts

export type UserRole = 'SuperAdmin' | 'TenantAdmin' | 'EPP' | 'Assistant' | 'TrustedAssistant' | 'SchoolAdmin' | 'ParentUser' | 'GovAnalyst';

export interface UserProfile {
    id: string; // auth.uid
    email: string;
    displayName: string;
    avatarUrl?: string;
    
    // Authorization
    role: UserRole;
    tenantId: string; // Current active tenant
    
    // Enterprise Expansion: Multi-Org Membership
    orgMemberships: {
        orgId: string;
        role: UserRole;
        status: 'active' | 'pending' | 'suspended';
        joinedAt: string;
    }[];

    // Contact & Privacy (For Availability/Emergency)
    contactInfo: {
        phone?: string;
        emergencyContact?: {
            name: string;
            phone: string;
            relationship: string;
            visibility: 'admins_only' | 'colleagues';
        };
    };

    preferences: {
        language: string;
        theme: 'light' | 'dark' | 'system';
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        timezone: string;
    };

    metadata: {
        lastLogin: string;
        createdAt: string;
        region: string; // Home data region
    };
}
