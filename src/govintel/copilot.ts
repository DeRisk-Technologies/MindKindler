// src/govintel/copilot.ts

import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export interface PolicyMemo {
    title: string;
    executiveSummary: string;
    findings: Array<{
        metric: string;
        analysis: string;
        severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: Array<{
        action: string;
        rationale: string;
        impact: string;
    }>;
    citations: any[]; // Evidence objects from RAG
}

export async function generateCopilotMemo(
    tenantId: string,
    snapshotData: any,
    focusArea: string
): Promise<PolicyMemo> {
    const generateFn = httpsCallable(functions, 'generatePolicyMemo');
    
    try {
        const result = await generateFn({
            tenantId,
            snapshotData,
            focusArea
        });
        
        return result.data as PolicyMemo;
    } catch (e) {
        console.error("GovIntel Copilot Failed", e);
        throw e;
    }
}

// Alias for compatibility
export const generatePolicyMemo = generateCopilotMemo;
