// src/hooks/use-schema-extensions.ts

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { SchemaExtensionField } from "@/marketplace/types";

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
        // If no tenantId is on the user object, assume 'default' for SuperAdmins/Devs.
        const tenantId = (user as any).tenantId || 'default'; 

        async function fetchConfig() {
            try {
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
                    console.log(`[Schema Hook] No config found at tenants/${tenantId}/settings/schema_config`);
                }
            } catch (e) {
                console.error("Failed to load schema extensions", e);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [user]);

    return { config, loading };
}
