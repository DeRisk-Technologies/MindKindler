// src/services/enterprise/org-service.ts
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { Organization } from "@/types/enterprise";

export const orgService = {
    /**
     * List all organizations (for SuperAdmin Tenant Management)
     */
    async getAllOrganizations(): Promise<Organization[]> {
        const q = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
    },

    /**
     * Get a specific organization's details
     */
    async getOrganization(orgId: string): Promise<Organization | null> {
        const ref = doc(db, "organizations", orgId);
        const snap = await getDoc(ref);
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null;
    }
};
