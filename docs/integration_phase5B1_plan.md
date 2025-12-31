# Integration Phase 5B-1 Plan: Marketplace & Pack Installer

## Objective
Build an **Integration Marketplace** that allows administrators to browse and install pre-configured "Packs". These packs act as accelerators, deploying governance rules, data mappings, training modules, and rollout checklists in a single click.

## 1. Data Model Strategy
**File:** `src/types/schema.ts` (Update)

- [ ] **InstalledPack (New):**
    - `id`, `tenantId`, `packId`, `version`
    - `installedAt`, `installedByUserId`
    - `status`: 'installed' | 'rolledBack'
    - `artifacts`: { collection: string, id: string }[] (Track created docs for rollback)

**File:** `src/marketplace/types.ts` (New)

- [ ] **MarketplaceManifest:**
    - `id`, `name`, `description`, `version`, `regionTags`
    - `actions`: Array of InstallActions
- [ ] **InstallAction:** Union type of:
    - `ImportPolicyPack` (rules[])
    - `ImportTrainingBundle` (modules[], paths[])
    - `CreateDataMapping` (mapping template)
    - `ImportRolloutChecklist` (checklist items)

## 2. Catalog & Packs
**Path:** `src/marketplace/catalog/` (New Folder)

Create JSON manifests for:
- `uk_la_pack.json`: UK policies (KCSIE), OneRoster mapping.
- `us_district_pack.json`: US policies (FERPA), Ed-Fi mapping.
- `nigeria_foundation_pack.json`: Localized checklist + policies.
- `dach_pack.json`: GDPR strict rules.
- `gulf_pack.json`: Data residency rules.

## 3. Installer Engine
**Path:** `src/marketplace/installer.ts` (New)

- [ ] **`installPack(manifest)`**:
    - Iterate through actions.
    - Write to Firestore (batch if possible, or sequential).
    - Store references to created IDs in `InstalledPack.artifacts`.
    - Log audit event.
- [ ] **`rollbackPack(installedPackId)`**:
    - Fetch `InstalledPack`.
    - Delete documents listed in `artifacts`.
    - Update status to `rolledBack`.

## 4. UI Implementation
**Path:** `src/app/dashboard/marketplace` (New Module)

- [ ] **Browse (`/page.tsx`)**:
    - Card grid of available packs.
    - Filters (Region, Type).
- [ ] **Detail (`/[id]/page.tsx`)**:
    - Description, contents list.
    - "Install" button (triggers installer).
- [ ] **Installed (`/installed/page.tsx`)**:
    - List of active packs.
    - "Rollback" / "Uninstall" button.

## 5. Execution Steps
1.  **Schema**: Define Manifest and InstalledPack types.
2.  **Catalog**: Create the JSON files.
3.  **Installer**: Build the installation and rollback logic.
4.  **UI**: Build the Marketplace pages.
5.  **Integration**: Ensure installed policies appear in Policy Manager, training in Library, etc.

## Manual Test Checklist
- [ ] **Browse**: Verify all 5 packs appear in the marketplace.
- [ ] **Install**: Install "UK LA Pack". Verify success toast.
- [ ] **Verify Artifacts**:
    - Go to Policy Manager: Check for UK rules.
    - Go to Training: Check for UK modules (if in pack).
- [ ] **Rollback**: Go to "Installed Packs". Click "Uninstall".
- [ ] **Verify Cleanup**: Check Policy Manager. The UK rules should be gone.
