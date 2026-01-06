// src/services/enterprise/org-service.ts
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, orderBy, updateDoc, where } from "firebase/firestore";
import { Organization } from "@/types/enterprise";

export const orgService = {
    /**
     * List all organizations
     */
    async getAllOrganizations(): Promise<Organization[]> {
        const q = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
    },

    /**
     * Get a specific organization
     */
    async getOrganization(orgId: string): Promise<Organization | null> {
        const ref = doc(db, "organizations", orgId);
        const snap = await getDoc(ref);
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null;
    },

    /**
     * Update organization details
     */
    async updateOrganization(orgId: string, data: Partial<Organization>): Promise<void> {
        const ref = doc(db, "organizations", orgId);
        await updateDoc(ref, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    },

    /**
     * Get potential parents for a hierarchy level
     */
    async getPotentialParents(type: string): Promise<Organization[]> {
        const parentTypeMap: Record<string, string[]> = {
            'state': ['national'],
            'lea': ['state', 'national'],
            'school': ['lea', 'state', 'national'],
            'agency': ['lea', 'national']
        };

        const allowedTypes = parentTypeMap[type] || [];
        if (allowedTypes.length === 0) return [];

        const q = query(
            collection(db, "organizations"), 
            where("type", "in", allowedTypes)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
    }
};
