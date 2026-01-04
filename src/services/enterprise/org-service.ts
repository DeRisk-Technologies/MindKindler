import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization, OrgType, DataRegion } from '@/types/enterprise';

// In a real multi-region app, we would dynamically initialize 'db' based on the user's region.
// For this MVP, we assume a single global router DB that points to regional instances.

export const enterpriseService = {
    
    async createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const orgRef = collection(db, 'organizations');
        const docRef = await addDoc(orgRef, {
            ...org,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async getOrganization(orgId: string): Promise<Organization | null> {
        const docRef = doc(db, 'organizations', orgId);
        const snap = await getDoc(docRef);
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null;
    },

    async getChildrenOrgs(parentId: string): Promise<Organization[]> {
        const q = query(
            collection(db, 'organizations'), 
            where('parentId', '==', parentId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
    },

    async registerSubOrg(parentId: string, subOrg: Partial<Organization>): Promise<string> {
        // Fetch parent to inherit region and rootId
        const parent = await this.getOrganization(parentId);
        if (!parent) throw new Error("Parent Org not found");

        return this.createOrganization({
            ...subOrg as any,
            parentId: parentId,
            rootId: parent.rootId || parent.id, // If parent is root, use its ID
            region: parent.region, // Enforce data residency inheritance
            settings: { ...parent.settings, ...subOrg.settings } // Inherit defaults
        });
    }
};
