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
    schoolId?: string;
}

export class StaffService {

    /**
     * Creates a new staff member in the Regional Data Shard.
     */
    static async createStaffMember(tenantId: string, region: string, data: StaffMember): Promise<string> {
        
        const regionalDb = getRegionalDb(region);
        
        const payload = {
            ...data,
            tenantId,
            status: 'active',
            createdAt: serverTimestamp(),
        };

        // WRITE TO ROOT COLLECTION 'staff' (Standardized)
        // This ensures queries like useFirestoreCollection('staff') work.
        const staffRef = await addDoc(collection(regionalDb, 'staff'), payload);
        
        console.log(`[StaffService] Created staff ${staffRef.id} in region ${region} (Root Collection)`);
        return staffRef.id;
    }

    /**
     * Updates an existing staff member (e.g., renewed DBS check).
     */
    static async updateStaffMember(tenantId: string, region: string, staffId: string, updates: Partial<StaffMember>) {
        const regionalDb = getRegionalDb(region);
        const staffRef = doc(regionalDb, 'staff', staffId);
        
        await updateDoc(staffRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        console.log(`[StaffService] Updated staff ${staffId} in region ${region}`);
    }
}
