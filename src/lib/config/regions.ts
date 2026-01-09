// src/lib/config/regions.ts

/**
 * REGIONAL_DB_MAPPING
 * 
 * Maps geographical regions to physical Firestore Database IDs.
 * Ensure these databases are created in the Firebase Console.
 */
export const REGIONAL_DB_MAPPING: Record<string, string> = {
    // Physical GCP Regions
    'us-central1': 'mindkindler-us',
    'europe-west3': 'mindkindler-eu',
    'europe-west2': 'mindkindler-uk',
    'me-central2': 'mindkindler-me',
    'asia-northeast1': 'mindkindler-asia',
    
    // Logical Region Codes (Used by App Logic)
    'uk': 'mindkindler-uk',
    'us': 'mindkindler-us',
    'eu': 'mindkindler-eu',
    'me': 'mindkindler-me',
    'asia': 'mindkindler-asia',
    
    'default': '(default)'
};

export const getDbForRegion = (region?: string) => {
    return REGIONAL_DB_MAPPING[region || 'default'] || REGIONAL_DB_MAPPING['default'];
};
