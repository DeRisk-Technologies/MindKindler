// src/marketplace/server-installer.ts
import * as admin from 'firebase-admin';
import { MarketplaceManifest, CountryPackConfig } from "./types";

export interface InstallationResult {
    success: boolean;
    manifestId: string;
    installedVersion: string;
    errors?: string[];
    logs: string[];
}

export class ServerMarketplaceInstaller {
    private db: admin.firestore.Firestore;

    constructor(db: admin.firestore.Firestore) {
        this.db = db;
    }

    /**
     * Installs or Updates a Country Pack for a specific Tenant.
     * Idempotent: Can be run multiple times safely.
     */
    async installPack(tenantId: string, manifest: MarketplaceManifest): Promise<InstallationResult> {
        const logs: string[] = [];
        logs.push(`Starting server-side installation of ${manifest.id} (v${manifest.version}) for tenant ${tenantId}...`);

        try {
            // 1. Validation
            this.validateManifest(manifest);
            logs.push("Manifest validation passed.");

            // 2. Install Capabilities (The Core "Country OS" Logic)
            if (manifest.capabilities) {
                await this.installCapabilities(tenantId, manifest.capabilities, logs);
            }

            // 3. Install Actions
            if (manifest.actions && manifest.actions.length > 0) {
                logs.push(`Skipping ${manifest.actions.length} legacy actions.`);
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
            const schemaRef = this.db.doc(`tenants/${tenantId}/settings/schema_config`);
            await schemaRef.set({
                studentFields: config.schemaExtensions.student,
                schoolFields: config.schemaExtensions.school,
                staffFields: config.schemaExtensions.staff || [],
                updatedAt: new Date().toISOString(),
                installedPackId: "uk_la_pack" 
            }, { merge: true });
            logs.push("Schema Extensions injected into tenant settings.");
        }

        // B. Compliance Workflows -> tenant_settings/workflows
        if (config.complianceWorkflows) {
            const workflowRef = this.db.doc(`tenants/${tenantId}/settings/workflows`);
            await workflowRef.set({
                workflows: config.complianceWorkflows, 
                updatedAt: new Date().toISOString()
            }, { merge: true });
            logs.push(`Registered ${config.complianceWorkflows.length} compliance workflows.`);
        }

        // C. Psychometrics -> tenant_settings/analytics
        if (config.psychometricConfig) {
            const analyticsRef = this.db.doc(`tenants/${tenantId}/settings/analytics`);
            
            const payload: any = {
                psychometrics: config.psychometricConfig,
                updatedAt: new Date().toISOString()
            };
            if (config.interventionLogic) {
                payload.interventionLogic = config.interventionLogic;
            }

            await analyticsRef.set(payload, { merge: true });
            logs.push("Psychometric Engine & Intervention Logic configured.");
        }

        // D. Statutory Reports -> tenant_settings/reporting
        if (config.statutoryReports) {
            const reportingRef = this.db.doc(`tenants/${tenantId}/settings/reporting`);
            await reportingRef.set({
                templates: config.statutoryReports,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            logs.push(`Installed ${config.statutoryReports.length} statutory report templates.`);
        }

        // E. Consultation Templates -> tenant_settings/consultation (NEW)
        if (config.consultationTemplates) {
             const consultationRef = this.db.doc(`tenants/${tenantId}/settings/consultation`);
             await consultationRef.set({
                 packTemplates: config.consultationTemplates, 
                 updatedAt: new Date().toISOString()
             }, { merge: true });
             logs.push(`Installed ${config.consultationTemplates.length} consultation templates.`);
        }
    }

    private async recordInstallation(tenantId: string, manifest: MarketplaceManifest) {
        // Also update the root tenant module flags
        const tenantRef = this.db.doc(`tenants/${tenantId}`);
        await tenantRef.set({
            modules: {
                [manifest.id]: true
            }
        }, { merge: true });

        const installRef = this.db.doc(`tenants/${tenantId}/installed_packs/${manifest.id}`);
        await installRef.set({
            packId: manifest.id, // Ensure ID is present
            version: manifest.version,
            installedAt: new Date().toISOString(),
            status: 'active'
        }, { merge: true });
    }
}
