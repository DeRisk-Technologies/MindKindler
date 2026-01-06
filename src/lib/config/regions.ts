// src/lib/config/regions.ts

/**
 * REGIONAL_DB_MAPPING
 * 
 * Maps geographical regions to physical Firestore Database IDs.
 * Ensure these databases are created in the Firebase Console.
 */
export const REGIONAL_DB_MAPPING: Record<string, string> = {
    'us-central1': 'mindkindler-us',
    'europe-west3': 'mindkindler-eu',
    'europe-west2': 'mindkindler-uk',
    'me-central2': 'mindkindler-me',
    'asia-northeast1': 'mindkindler-asia',
    'default': '(default)'
};

export const getDbForRegion = (region?: string) => {
    return REGIONAL_DB_MAPPING[region || 'default'] || REGIONAL_DB_MAPPING['default'];
};
