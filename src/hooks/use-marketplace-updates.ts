// src/hooks/use-marketplace-updates.ts

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestoreDocument } from '@/hooks/use-firestore';
import { MarketplaceManifest } from '@/marketplace/types';

// Import Catalog Directly
import UK_PACK from '@/marketplace/catalog/uk_la_pack.json';
import US_PACK from '@/marketplace/catalog/us_district_pack.json';
import GULF_PACK from '@/marketplace/catalog/gulf_pack.json';

const FULL_CATALOG: MarketplaceManifest[] = [
    UK_PACK as any,
    US_PACK as any,
    GULF_PACK as any
];

export interface PackUpdate {
    manifest: MarketplaceManifest;
    installedVersion: string;
    latestVersion: string;
    changelog?: string;
}

export interface NewModule {
    manifest: MarketplaceManifest;
    reason: string;
}

export function useMarketplaceUpdates() {
    const { user } = useAuth();
    
    // Fetch Installed Packs from Global Control Plane (Default DB)
    const { data: installedData, loading } = useFirestoreDocument<Record<string, { version: string }>>(
        `tenants/${user?.tenantId}/settings`,
        'installed_packs',
        'default' // Force global DB
    );

    const updates = useMemo(() => {
        if (loading || !installedData || !user?.region) return { updatesAvailable: [], newModulesAvailable: [] };

        const updatesAvailable: PackUpdate[] = [];
        const newModulesAvailable: NewModule[] = [];

        // 1. Check for Updates
        Object.entries(installedData).forEach(([packId, info]) => {
            if (packId === 'id') return; // Firestore artifacts

            const catalogPack = FULL_CATALOG.find(p => p.id === packId);
            if (catalogPack) {
                if (isVersionNewer(catalogPack.version, info.version)) {
                    updatesAvailable.push({
                        manifest: catalogPack,
                        installedVersion: info.version,
                        latestVersion: catalogPack.version,
                        changelog: catalogPack.changelog
                    });
                }
            }
        });

        // 2. Check for New Modules (matching User's Region)
        // Heuristic: If user is 'uk', show new 'UK' packs not yet installed.
        // We normalize region matching (simple substring or exact match).
        FULL_CATALOG.forEach(pack => {
            const isInstalled = !!installedData[pack.id];
            if (!isInstalled) {
                // Check region match
                const userRegion = user.region?.toLowerCase(); // e.g. 'uk'
                const packRegions = pack.regionTags.map(t => t.toLowerCase()); // ['uk', 'europe']
                
                if (packRegions.some(tag => tag === userRegion || userRegion?.includes(tag))) {
                    newModulesAvailable.push({
                        manifest: pack,
                        reason: `New module available for your region (${user.region?.toUpperCase()}).`
                    });
                }
            }
        });

        return { updatesAvailable, newModulesAvailable };

    }, [installedData, loading, user?.region]);

    return { ...updates, loading };
}

// Helper: Semantic Versioning Check (Simple)
function isVersionNewer(latest: string, current: string): boolean {
    if (!current) return true;
    if (latest === current) return false;

    const v1 = latest.split('.').map(Number);
    const v2 = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;
        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }
    return false;
}
