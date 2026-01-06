// src/types/enterprise.ts

export type OrgType = 'national' | 'state' | 'lea' | 'school' | 'agency' | 'clinic';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'lifetime';

export type DataRegion = 
    | 'us-central1' 
    | 'europe-west3' 
    | 'europe-west2' 
    | 'me-central2' 
    | 'asia-northeast1' 
    | 'northamerica-northeast1' 
    | 'europe-west1'; // Added Canada and France

export interface Organization {
    id: string;
    parentId?: string; // For hierarchy (e.g., School -> LEA)
    rootId?: string;   // For fast lookup of top-level Org (e.g., Ministry)
    
    name: string;
    type: OrgType;
    region: DataRegion; // Strict data residency
    
    // Contact Info
    primaryContact: {
        name: string;
        email: string; // CEO/Head
        phone?: string;
        roleTitle: string;
    };
    
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Commercial
    subscriptionId?: string;
    billingEmail?: string;
    planTier: 'essential' | 'professional' | 'enterprise';
    
    // Metadata
    studentCount?: number;
    staffCount?: number;
    
    settings: {
        branding?: { logoUrl: string; primaryColor: string };
        features: Record<string, boolean>; // Feature flags
        security: {
            mfaRequired: boolean;
            ssoProvider?: 'google' | 'azure_ad' | 'okta';
            ssoDomain?: string;
        };
    };
    
    createdAt: string;
    updatedAt: string;
}

export interface HierarchyNode {
    id: string; // Org ID
    name: string;
    type: OrgType;
    children?: HierarchyNode[]; // Calculated on read
}

export interface OrgStaffRole {
    userId: string;
    orgId: string;
    role: 'admin' | 'staff' | 'viewer';
    title?: string;
    department?: string;
    assignedSchools?: string[]; // If LEA staff manages specific schools
}

export interface EnterpriseAuditLog {
    id: string;
    orgId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    region: DataRegion;
    timestamp: string;
    metadata: Record<string, any>;
}
