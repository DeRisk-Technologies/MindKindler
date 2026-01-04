// src/lib/config/regions.ts

export const REGIONAL_DB_MAPPING: Record<string, string> = {
    'us-central1': 'mindkindler-us',
    'europe-west3': 'mindkindler-eu',
    'asia-northeast1': 'mindkindler-asia',
    'default': '(default)' // The main database
};

export const getDbForRegion = (region?: string) => {
    return REGIONAL_DB_MAPPING[region || 'default'] || REGIONAL_DB_MAPPING['default'];
};
