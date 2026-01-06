// src/types/hierarchy.ts

import { DataRegion } from "./enterprise";

// 1. Data Modeling (Fractal Multi-Tenancy)

export type OrgUnitType = 
    // Generic / USA
    | 'national' | 'state' | 'county' | 'district' | 'school'
    // UK
    | 'region_uk' | 'local_authority' | 'trust'
    // Germany
    | 'bundesland' | 'regierungsbezirk' | 'landkreis'
    // Japan
    | 'prefecture' | 'municipality'
    // France
    | 'region_academique' | 'academie' | 'departement'
    // Saudi Arabia
    | 'general_directorate' | 'education_office';

export type SubscriptionTier = 'NATIONAL_AI_ANALYTICS' | 'STATE_OVERSIGHT' | 'DISTRICT_STANDARD' | 'SCHOOL_BASIC' | 'FREELANCER_PRO' | 'FREE_TIER';

export interface OrgUnit {
    id: string;
    parentId?: string; // Root nodes have no parent
    name: string;
    type: OrgUnitType;
    countryCode: string; // 'US', 'UK', 'DE', 'JP', 'FR', 'SA'
    
    // Topology & Security
    ancestors: string[]; // Array of parent IDs [nat_id, state_id, ...] for O(1) security checks
    regionShard: DataRegion; // The physical database this unit's data resides in
    
    // Fractal Tenancy (The "Paying Customer" logic)
    isTenantRoot: boolean; // If true, this node is a paying customer (Tenant)
    tenantId?: string; // Link to the 'organizations' collection if this unit is a tenant
    subscriptionTier?: SubscriptionTier;
    
    // Metadata
    metadata?: {
        officialId?: string; // NCES ID, URN, UAI, etc.
        studentCount?: number;
        website?: string;
    };
    
    createdAt: string;
    updatedAt: string;
}

// 2. Hierarchy Configuration

export interface HierarchyLevel {
    type: OrgUnitType;
    label: string; // Dynamic label e.g., "Select Académie"
    nextLevel?: HierarchyLevel | ((parent: OrgUnit) => HierarchyLevel | null); // Recursive definition
    canBeTenantRoot?: boolean; // Can this level buy the software?
    allowManualEntry?: boolean; // Can a user add a missing record here?
}

// The "Gold Standard" Hierarchy Definitions
export const COUNTRY_HIERARCHIES: Record<string, HierarchyLevel> = {
    'US': {
        type: 'national', label: 'National (USA)', canBeTenantRoot: true,
        nextLevel: {
            type: 'state', label: 'Select State', canBeTenantRoot: true,
            nextLevel: {
                type: 'county', label: 'Select County', canBeTenantRoot: false,
                nextLevel: {
                    type: 'district', label: 'Select School District', canBeTenantRoot: true,
                    nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
                }
            }
        }
    },
    'UK': {
        type: 'national', label: 'National (DfE)', canBeTenantRoot: true,
        nextLevel: {
            type: 'region_uk', label: 'Select Region (e.g. London, South East)', canBeTenantRoot: false, // Administrative only
            nextLevel: {
                type: 'local_authority', label: 'Select Local Authority (LEA/Council)', canBeTenantRoot: true,
                allowManualEntry: true, // Allow adding missing councils
                nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
            }
        }
    },
    'DE': {
        type: 'national', label: 'National (Bund)',
        nextLevel: {
            type: 'bundesland', label: 'Select Bundesland (State)', canBeTenantRoot: true,
            nextLevel: {
                type: 'regierungsbezirk', label: 'Select Regierungsbezirk',
                nextLevel: {
                    type: 'landkreis', label: 'Select Landkreis (District)', canBeTenantRoot: true,
                    nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
                }
            }
        }
    },
    'JP': {
        type: 'national', label: 'National (MEXT)',
        nextLevel: {
            type: 'prefecture', label: 'Select Prefecture', canBeTenantRoot: true,
            nextLevel: (parent) => ({
                // Hybrid Logic: High Schools often skip municipality
                type: 'municipality', label: 'Select Municipality (City/Ward)', canBeTenantRoot: true,
                nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
            })
        }
    },
    'FR': {
        type: 'national', label: 'National (Ministry)',
        nextLevel: {
            type: 'region_academique', label: 'Select Région Académique',
            nextLevel: {
                type: 'academie', label: 'Select Académie', canBeTenantRoot: true,
                nextLevel: {
                    type: 'departement', label: 'Select Département', canBeTenantRoot: true,
                    nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
                }
            }
        }
    },
    'SA': {
        type: 'national', label: 'National (Ministry)',
        nextLevel: {
            type: 'general_directorate', label: 'Select General Directorate (Mintaqah)', canBeTenantRoot: true,
            nextLevel: {
                type: 'education_office', label: 'Select Education Office (Maktab)', canBeTenantRoot: true,
                nextLevel: { type: 'school', label: 'Select School', canBeTenantRoot: true, allowManualEntry: true }
            }
        }
    }
};
