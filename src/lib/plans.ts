// src/lib/plans.ts

export const PLAN_FEATURES = {
    essential: {
        max_students: 50,
        ai_model: 'standard', // gpt-3.5-turbo equivalent
        storage_gb: 5,
        hierarchy_enabled: false,
        sso_enabled: false,
        support_level: 'community'
    },
    professional: {
        max_students: -1, // Unlimited
        ai_model: 'advanced', // gpt-4 equivalent
        storage_gb: 1000,
        hierarchy_enabled: false,
        sso_enabled: false,
        support_level: 'priority'
    },
    enterprise: {
        max_students: -1,
        ai_model: 'advanced_custom', // Fine-tuned models
        storage_gb: -1, // Unlimited
        hierarchy_enabled: true, // Access to GovIntel
        sso_enabled: true,
        support_level: 'dedicated'
    }
};

export const getPlanLimits = (planId: string) => {
    if (planId.includes('enterprise')) return PLAN_FEATURES.enterprise;
    if (planId.includes('pro')) return PLAN_FEATURES.professional;
    return PLAN_FEATURES.essential;
};
