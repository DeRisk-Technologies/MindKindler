// src/marketplace/installer.ts

import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { MarketplaceManifest, CountryPackConfig } from "./types";

export interface InstallationResult {
    success: boolean;
    manifestId: string;
    installedVersion: string;
    errors?: string[];
    logs: string[];
}

export class MarketplaceInstaller {
    
    /**
     * Installs or Updates a Country Pack for a specific Tenant.
     * Idempotent: Can be run multiple times safely.
     */
    async installPack(tenantId: string, manifest: MarketplaceManifest): Promise<InstallationResult> {
        const logs: string[] = [];
        logs.push(`Starting installation of ${manifest.id} (v${manifest.version}) for tenant ${tenantId}...`);

        try {
            // 1. Validation
            this.validateManifest(manifest);
            logs.push("Manifest validation passed.");

            // 2. Install Capabilities (The Core "Country OS" Logic)
            if (manifest.capabilities) {
                await this.installCapabilities(tenantId, manifest.capabilities, logs);
            }

            // 3. Install Actions (Legacy / Standard Actions)
            if (manifest.actions && manifest.actions.length > 0) {
                // Future implementation: Execute standard actions like 'createPolicyRule'
                // For now, we focus on the new 'capabilities' engine.
                logs.push(`Skipping ${manifest.actions.length} legacy actions (not implemented in V2 installer).`);
            }

            // 4. Update Tenant Metadata (Record of Installation)
            await this.recordInstallation(tenantId, manifest);
            logs.push("Installation record updated.");

            return {
                success: true,
                manifestId: manifest.id,
                installedVersion: manifest.version,
                logs
            };

        } catch (error: any) {
            console.error("Installation Failed", error);
            return {
                success: false,
                manifestId: manifest.id,
                installedVersion: manifest.version,
                errors: [error.message],
                logs
            };
        }
    }

    private validateManifest(manifest: MarketplaceManifest) {
        if (!manifest.id || !manifest.version) {
            throw new Error("Invalid Manifest: Missing ID or Version.");
        }
        if (manifest.capabilities) {
            const caps = manifest.capabilities;
            if (!caps.countryCode) throw new Error("Invalid Capabilities: Missing countryCode.");
            if (!caps.psychometricConfig) throw new Error("Invalid Capabilities: Missing psychometricConfig.");
        }
    }

    private async installCapabilities(tenantId: string, config: CountryPackConfig, logs: string[]) {
        
        // A. Schema Extensions -> tenant_settings/schema_config
        if (config.schemaExtensions) {
            const schemaRef = doc(db, `tenants/${tenantId}/settings/schema_config`);
            await setDoc(schemaRef, {
                studentFields: config.schemaExtensions.student,
                schoolFields: config.schemaExtensions.school,
                staffFields: config.schemaExtensions.staff || [], // New for SCR
                updatedAt: new Date().toISOString(),
                installedPackId: "uk_la_pack" // dynamic in real world
            }, { merge: true });
            logs.push("Schema Extensions injected into tenant settings.");
        }

        // B. Compliance Workflows -> tenant_settings/workflows
        if (config.complianceWorkflows) {
            const workflowRef = doc(db, `tenants/${tenantId}/settings/workflows`);
            // We use merge: true to avoid wiping existing workflows from other packs
            // But we ideally want to replace workflows *from this pack*.
            // For MVP, simple merge is acceptable.
            await setDoc(workflowRef, {
                workflows: config.complianceWorkflows, // Warning: Overwrites all workflows for now (MVP simplifiction)
                updatedAt: new Date().toISOString()
            }, { merge: true });
            logs.push(`Registered ${config.complianceWorkflows.length} compliance workflows.`);
        }

        // C. Psychometrics -> tenant_settings/analytics
        if (config.psychometricConfig) {
            const analyticsRef = doc(db, `tenants/${tenantId}/settings/analytics`);
            
            // Phase 10: Inject Intervention Logic
            const payload: any = {
                psychometrics: config.psychometricConfig,
                updatedAt: new Date().toISOString()
            };
            if (config.interventionLogic) {
                payload.interventionLogic = config.interventionLogic;
            }

            await setDoc(analyticsRef, payload, { merge: true });
            logs.push("Psychometric Engine & Intervention Logic configured.");
        }

        // D. Statutory Reports -> tenant_settings/reporting
        if (config.statutoryReports) {
            const reportingRef = doc(db, `tenants/${tenantId}/settings/reporting`);
            await setDoc(reportingRef, {
                templates: config.statutoryReports,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            logs.push(`Installed ${config.statutoryReports.length} statutory report templates.`);
        }
    }

    private async recordInstallation(tenantId: string, manifest: MarketplaceManifest) {
        const installRef = doc(db, `tenants/${tenantId}/settings/installed_packs`);
        await setDoc(installRef, {
            [manifest.id]: {
                version: manifest.version,
                installedAt: new Date().toISOString(),
                status: 'active'
            }
        }, { merge: true });
    }
}
