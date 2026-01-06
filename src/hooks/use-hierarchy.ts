// src/hooks/use-hierarchy.ts

import { useState, useEffect } from 'react';
import { OrgUnit, COUNTRY_HIERARCHIES, HierarchyLevel } from '@/types/hierarchy';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { GLOBAL_LEA_DATA } from '@/lib/data/gov/global-lea-data';
import { UK_SCHOOL_SAMPLES } from '@/lib/data/gov/uk-school-samples'; // Import School Samples

const getDb = () => db; 

// Initial Seed Data for National Roots (Self-Repairing)
const SEED_ROOTS: Record<string, Partial<OrgUnit>> = {
    'US': { name: 'United States Department of Education', type: 'national', regionShard: 'us-central1' },
    'UK': { name: 'Department for Education (DfE)', type: 'national', regionShard: 'europe-west2' },
    'DE': { name: 'Bundesministerium für Bildung und Forschung', type: 'national', regionShard: 'europe-west3' },
    'JP': { name: 'MEXT (Ministry of Education, Culture, Sports, Science and Technology)', type: 'national', regionShard: 'asia-northeast1' },
    'FR': { name: 'Ministère de l\'Éducation nationale', type: 'national', regionShard: 'europe-west1' },
    'SA': { name: 'Ministry of Education', type: 'national', regionShard: 'me-central2' }
};

export function useHierarchy(countryCode: string) {
    const [loading, setLoading] = useState(false);
    const [rootDef, setRootDef] = useState<HierarchyLevel | null>(null);

    useEffect(() => {
        if (countryCode && COUNTRY_HIERARCHIES[countryCode]) {
            setRootDef(COUNTRY_HIERARCHIES[countryCode]);
        }
    }, [countryCode]);

    /**
     * Fetch children nodes.
     * Auto-Seeds National, Regions, AND Schools if missing.
     */
    const fetchChildren = async (parentId: string, type: string, country: string) => {
        setLoading(true);
        try {
            const q = query(
                collection(getDb(), 'org_units'),
                where('parentId', '==', parentId),
                where('countryCode', '==', country)
            );
            const snapshot = await getDocs(q);
            let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OrgUnit));
            
            // 1. Auto-Seed National Root
            if (parentId === 'root' && results.length === 0 && SEED_ROOTS[country]) {
                const seed = SEED_ROOTS[country];
                const newRoot = await addManualNode(null, seed.name!, seed.type!, seed.regionShard!, country);
                results = [newRoot]; 
            }

            // 2. Auto-Seed Sub-Levels (Recursive Seeding)
            // If we found NO children for the current parent, check if we have static data to seed
            if (results.length === 0 && parentId !== 'root') {
                const regionKeyMap: Record<string, string> = {
                    'UK': 'europe-west2',
                    'US': 'us-central1',
                    'DE': 'europe-west3',
                    'SA': 'me-central2',
                    'JP': 'asia-northeast1',
                    'CA': 'northamerica-northeast1'
                };
                
                const regionKey = regionKeyMap[country];
                const staticData = GLOBAL_LEA_DATA[regionKey] || [];
                
                // Get parent details to filter correct children
                let parentName = "";
                let parentMetadata: any = {}; // Need raw parent data to check IDs/URNs if needed
                
                const parentRef = doc(getDb(), 'org_units', parentId);
                const parentSnap = await getDoc(parentRef);
                if (parentSnap.exists()) {
                    parentName = parentSnap.data().name;
                    parentMetadata = parentSnap.data(); // Capture potential stored URN/ID
                }

                // --- SCHOOL SEEDING LOGIC ---
                if (type === 'school') {
                    // Check if we have schools mapped to this LEA
                    // In real world, we match by LEA ID. In this mock, we might match by Name or assume context.
                    // UK_SCHOOL_SAMPLES has 'leaId' field. 
                    // To make this work dynamically, we need to know the 'leaId' of the current parent node from our static list.
                    // BUT, the parent in Firestore has a random Firestore ID.
                    // TRICK: We match based on the Parent Name.
                    
                    // 1. Find the LEA definition in our static list that matches the current Parent Name
                    const leaDefinition = staticData.find(lea => lea.name === parentName);
                    const leaStaticId = leaDefinition?.id;

                    if (leaStaticId && country === 'UK') {
                        // Filter schools that belong to this LEA ID
                        const potentialSchools = UK_SCHOOL_SAMPLES.filter(s => s.leaId === leaStaticId);
                        
                        if (potentialSchools.length > 0) {
                            console.log(`[Hierarchy] Seeding ${potentialSchools.length} schools for ${parentName}...`);
                            const seedPromises = potentialSchools.map(school => 
                                addManualNode(
                                    { id: parentId, name: parentName, ancestors: [] } as any, 
                                    school.name, 
                                    'school', 
                                    regionKey, 
                                    country
                                )
                            );
                            results = await Promise.all(seedPromises);
                        }
                    }
                } 
                // --- REGION/LEA SEEDING LOGIC ---
                else {
                    // Filter for items that match the requested TYPE AND Parent Region
                    const potentialSeeds = staticData.filter(item => 
                        item.type === type && 
                        (!item.region || item.region === parentName) 
                    );

                    if (potentialSeeds.length > 0) {
                        console.log(`[Hierarchy] Seeding ${potentialSeeds.length} children for ${parentName}...`);
                        const seedPromises = potentialSeeds.map(item => 
                            addManualNode(
                                { id: parentId, name: parentName, ancestors: [] } as any, 
                                item.name, 
                                type, 
                                regionKey, 
                                country
                            )
                        );
                        results = await Promise.all(seedPromises);
                    }
                }
            }

            return results.sort((a, b) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Adds a missing node to the hierarchy.
     */
    const addManualNode = async (
        parent: OrgUnit | null, 
        name: string, 
        type: string,
        regionShard: string,
        explicitCountry?: string 
    ) => {
        const targetCountry = explicitCountry || countryCode;
        const parentPath = parent ? (parent.ancestors ? [...parent.ancestors, parent.id] : [parent.id]) : [];
        
        const newUnit: Partial<OrgUnit> = {
            parentId: parent?.id || 'root',
            name,
            type: type as any,
            countryCode: targetCountry,
            regionShard,
            ancestors: parentPath,
            isTenantRoot: false, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const ref = await addDoc(collection(getDb(), 'org_units'), newUnit);
        return { id: ref.id, ...newUnit } as OrgUnit;
    };

    return { rootDef, fetchChildren, addManualNode, loading };
}
