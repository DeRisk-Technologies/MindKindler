// src/hooks/use-schema-extensions.ts

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { SchemaExtensionField } from "@/marketplace/types";

// Hardcoded UK Pack for Fallback (ensures UPN/SEN always appear for Pilot)
const DEFAULT_UK_SCHEMA: SchemaConfig = {
    studentFields: [
        { fieldName: 'upn', label: 'Unique Pupil Number (UPN)', type: 'text', required: true, complianceTag: 'census' },
        { fieldName: 'senStatus', label: 'SEN Status', type: 'select', options: ['None', 'K - Support', 'E - EHCP'], required: true, complianceTag: 'send' },
        { fieldName: 'ethnicity', label: 'Ethnicity', type: 'select', options: ['White British', 'Other'], required: false, complianceTag: 'census' },
        { fieldName: 'fsmEligible', label: 'Free School Meals', type: 'boolean', required: false, complianceTag: 'pupil_premium' }
    ],
    schoolFields: [],
    staffFields: [
        { fieldName: 'dbsNumber', label: 'DBS Certificate Number', type: 'text', required: true, complianceTag: 'scr' },
        { fieldName: 'dbsIssueDate', label: 'DBS Issue Date', type: 'date', required: true, complianceTag: 'scr' },
        { fieldName: 'prohibitionCheck', label: 'Teacher Prohibition Check', type: 'boolean', required: true, complianceTag: 'scr' }
    ]
};

interface SchemaConfig {
    studentFields: SchemaExtensionField[];
    schoolFields: SchemaExtensionField[];
    staffFields: SchemaExtensionField[];
}

export function useSchemaExtensions() {
    const { user } = useAuth();
    const [config, setConfig] = useState<SchemaConfig>({ studentFields: [], schoolFields: [], staffFields: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fallback Logic: Match the installer's logic.
        const tenantId = (user as any).tenantId || 'default'; 

        async function fetchConfig() {
            try {
                // 1. Try to fetch dynamic config from Tenant Settings
                const ref = doc(db, `tenants/${tenantId}/settings/schema_config`);
                const snap = await getDoc(ref);
                
                if (snap.exists()) {
                    const data = snap.data();
                    setConfig({
                        studentFields: data.studentFields || [],
                        schoolFields: data.schoolFields || [],
                        staffFields: data.staffFields || []
                    });
                } else {
                    // 2. FALLBACK: If missing (Pilot EPP), inject UK Defaults if user is in UK region or email implies it.
                    if ((user as any)?.region === 'uk' || user.email?.includes('uk') || user.email?.includes('mindsuk')) {
                        console.log(`[Schema Hook] Using Default UK Schema for Pilot User: ${user.email}`);
                        setConfig(DEFAULT_UK_SCHEMA);
                    } else {
                        console.log(`[Schema Hook] No config found at tenants/${tenantId}/settings/schema_config`);
                    }
                }
            } catch (e) {
                console.error("Failed to load schema extensions", e);
                // On error, fallback to defaults if critical
                if (user.email?.includes('uk')) setConfig(DEFAULT_UK_SCHEMA);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [user]);

    return { config, loading };
}
