// src/govintel/procurement/generator.ts

import { GovSnapshot } from "@/analytics/govSnapshots";
import { KnowledgeChunk, PolicyRule, KnowledgeDocument } from "@/types/schema";
import { retrieveContext } from "@/ai/knowledge/retrieve";

export interface ProcurementPack {
  id?: string;
  tenantId: string;
  scopeType: 'council' | 'state' | 'federal';
  scopeId: string;
  jurisdiction: string;
  status: 'draft' | 'finalized';
  snapshotRef: string;
  scenarioRef?: string;
  documents: {
    templateId: string;
    title: string;
    contentHtml: string;
    citations: KnowledgeChunk[];
  }[];
  createdAt: string;
}

export const TEMPLATES = [
    { id: 'exec_summary', title: 'Executive Summary & Value Proposition' },
    { id: 'tech_arch', title: 'Technical Architecture & Security' },
    { id: 'compliance', title: 'Compliance & Safeguarding Statement' },
    { id: 'implementation', title: 'Implementation & Rollout Plan' },
    { id: 'budget', title: 'Resource & Budget Plan' }
];

export async function generatePack(
    snapshot: GovSnapshot,
    context: { scopeType: any, scopeId: string, jurisdiction: string }
): Promise<ProcurementPack> {
    
    // 1. Generate Documents
    const docs = await Promise.all(TEMPLATES.map(async (tmpl) => {
        const { html, citations } = await generateDocument(tmpl.id, snapshot, context);
        return {
            templateId: tmpl.id,
            title: tmpl.title,
            contentHtml: html,
            citations
        };
    }));

    return {
        tenantId: "default",
        scopeType: context.scopeType,
        scopeId: context.scopeId,
        jurisdiction: context.jurisdiction,
        status: 'draft',
        snapshotRef: snapshot.id || "unknown",
        documents: docs,
        createdAt: new Date().toISOString()
    };
}

async function generateDocument(templateId: string, snapshot: GovSnapshot, context: any) {
    let html = "";
    let query = "";

    switch (templateId) {
        case 'exec_summary':
            html = `<h2>Executive Summary</h2>
            <p>MindKindler proposes to enhance educational outcomes across the ${context.jurisdiction} jurisdiction.</p>
            <p>Current operational data indicates ${snapshot.metrics.assessments.total} assessments completed this period, with a critical safeguarding incidence rate of ${snapshot.metrics.safeguarding.critical}.</p>
            <p>Our solution provides AI-driven insights to reduce backlog and improve intervention efficacy.</p>`;
            query = "education strategy value proposition";
            break;
        case 'tech_arch':
            html = `<h2>Technical Architecture</h2>
            <p>The platform is built on a secure, scalable cloud infrastructure compliant with local data residency requirements.</p>
            <ul>
                <li><strong>Cloud Provider:</strong> Google Cloud Platform (Europe-West3)</li>
                <li><strong>Database:</strong> Firestore (Encrypted at rest)</li>
                <li><strong>AI Model:</strong> Gemini 1.5 Flash (Enterprise Grade)</li>
            </ul>`;
            query = "data security architecture";
            break;
        case 'compliance':
            html = `<h2>Compliance & Safeguarding</h2>
            <p>We adhere to strict safeguarding protocols. Currently tracking ${snapshot.metrics.compliance.findings} compliance findings.</p>
            <p>All staff are vetted and training compliance is at ${snapshot.metrics.training.completions} modules completed.</p>`;
            query = "safeguarding policy compliance";
            break;
        case 'budget':
            html = `<h2>Resource & Budget Plan</h2>
            <p>Based on current workload (${snapshot.metrics.interventions.active} active plans), we project the need for additional resources to meet backlog clearance targets.</p>
            <p>Please refer to the detailed Capacity Planner output for financial breakdowns.</p>`;
            query = "budget planning resources";
            break;
        default:
            html = `<p>Content for ${templateId} goes here.</p>`;
            query = "general policy";
    }

    // Retrieve Citations
    const retrieval = await retrieveContext(query, { verifiedOnly: true });
    
    return { html, citations: retrieval.map(r => r.chunk) };
}
