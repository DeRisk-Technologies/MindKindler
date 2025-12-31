"use client";

import { useEffect, useState } from "react";
import { AssessmentTemplate } from "@/types/schema";
import { Loader2 } from "lucide-react";
import { AssessmentBuilder } from "@/components/dashboard/assessments/assessment-builder";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditTemplatePage({ params }: PageProps) {
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    if (!id) return <Loader2 className="animate-spin m-8" />;

    return (
        <div className="flex-1 p-8 pt-6">
            <ClientBuilderWrapper id={id} />
        </div>
    );
}

function ClientBuilderWrapper({ id }: { id: string }) {
    const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const docRef = doc(db, "assessment_templates", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTemplate({ id: docSnap.id, ...docSnap.data() } as AssessmentTemplate);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id]);

    if (loading) return <Loader2 className="animate-spin m-8" />;

    return <AssessmentBuilder existingTemplate={template || undefined} />; 
}
