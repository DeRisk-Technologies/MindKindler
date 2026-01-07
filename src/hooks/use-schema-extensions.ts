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
        if (!user?.tenantId) return;

        async function fetchConfig() {
            try {
                const ref = doc(db, `tenants/${user?.tenantId}/settings/schema_config`);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setConfig({
                        studentFields: data.studentFields || [],
                        schoolFields: data.schoolFields || [],
                        staffFields: data.staffFields || []
                    });
                }
            } catch (e) {
                console.error("Failed to load schema extensions", e);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [user?.tenantId]);

    return { config, loading };
}
