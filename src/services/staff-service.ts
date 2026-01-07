// src/services/staff-service.ts

import { db } from "@/lib/firebase";
import { getRegionalDb } from "@/lib/firebase"; // SECURITY: Ensures Multi-DB Routing
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

export interface StaffMember {
    id?: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
    extensions?: Record<string, any>; // SCR Fields (DBS, etc.)
    status: 'active' | 'suspended' | 'archived';
    createdAt?: any;
}

export class StaffService {

    /**
     * Creates a new staff member in the Regional Data Shard.
     * SECURITY: Writes to REGIONAL SHARD (not Global Router) because SCR data (DBS) is PII.
     */
    static async createStaffMember(tenantId: string, region: string, data: StaffMember): Promise<string> {
        
        // 1. Get the Regional DB Instance (e.g. mindkindler-uk)
        const regionalDb = getRegionalDb(region);
        
        // 2. Prepare the payload
        const payload = {
            ...data,
            tenantId,
            status: 'active',
            createdAt: serverTimestamp(),
            // Ensure encryption flag is respected (Client-Side Encryption logic would go here)
            // For V1, we rely on Firestore Rules and At-Rest Encryption.
        };

        // 3. Write to the Tenant's Subcollection in the Regional Shard
        // Path: tenants/{tenantId}/staff/{staffId}
        const staffRef = await addDoc(collection(regionalDb, `tenants/${tenantId}/staff`), payload);
        
        console.log(`[StaffService] Created staff ${staffRef.id} in region ${region}`);
        return staffRef.id;
    }

    /**
     * Updates an existing staff member (e.g., renewed DBS check).
     */
    static async updateStaffMember(tenantId: string, region: string, staffId: string, updates: Partial<StaffMember>) {
        const regionalDb = getRegionalDb(region);
        const staffRef = doc(regionalDb, `tenants/${tenantId}/staff`, staffId);
        
        await updateDoc(staffRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        console.log(`[StaffService] Updated staff ${staffId} in region ${region}`);
    }
}
