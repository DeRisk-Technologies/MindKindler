# MindKindler Product & Pricing Strategy

## Executive Summary
MindKindler adopts a tiered SaaS model designed to scale from individual practitioners to national governments. The pricing strategy leverages **feature gating** (AI, Storage) and **governance depth** (Hierarchy, Residency) as primary differentiators.

## Product Tiers

### 1. MindKindler Essential (Freelancer)
**Target:** Independent Educational Psychologists (EPPs), Solo Practitioners.
**Pricing Model:** Flat Monthly Subscription (e.g., $29/mo).
**Key Differentiators:**
*   **Capacity:** Limited to 50 Active Students/Cases.
*   **AI:** Standard Report Generation (Basic Templates).
*   **Storage:** 5GB Document Storage.
*   **Support:** Community Forum Only.
*   **Access:** Single User Account.

### 2. MindKindler Professional (Team)
**Target:** Private Clinics, Independent Agencies, Individual Schools.
**Pricing Model:** Per Seat / Month (e.g., $79/user/mo).
**Key Differentiators:**
*   **Capacity:** Unlimited Students & Cases.
*   **AI:** Advanced Co-Pilot (Chat), Risk Prediction, Custom Templates.
*   **Storage:** 1TB Shared Storage + Bulk Upload Tools.
*   **Integrations:** Microsoft Teams / Google Workspace (Calendar & Meetings).
*   **Support:** Email & In-App Chat.
*   **Collaboration:** Case Sharing, Team Roles.

### 3. MindKindler Enterprise (Government)
**Target:** LEAs, School Districts, State Departments, Ministries.
**Pricing Model:** Annual Contract (Volume Licensing).
**Key Differentiators:**
*   **Governance:** Hierarchical Data Model (State -> District -> School).
*   **Data Sovereignty:** Dedicated Regional Database (GDPR/FERPA strict isolation).
*   **Security:** SSO (SAML/OIDC), Advanced Audit Logs, IP Allow-listing.
*   **Integration:** Full API Access (LMS/MIS Sync), Custom Webhooks.
*   **Support:** Dedicated Account Manager + SLA.

## Feature Matrix

| Feature | Essential | Professional | Enterprise |
| :--- | :---: | :---: | :---: |
| **Caseload** | 50 Students | Unlimited | Unlimited |
| **AI Report Writer** | Standard | Advanced | Advanced + Custom |
| **AI Co-Pilot** | No | Yes | Yes |
| **Bulk Data Import** | No | Yes | Yes |
| **Meeting Scheduler** | Basic | Integrated (Teams/Zoom) | Integrated |
| **Hierarchy / Aggregation** | No | No | Yes |
| **Data Residency** | Shared (Regional) | Shared (Regional) | Dedicated Shard |
| **SSO** | Google/Email | Google/Email | SAML / OIDC |
| **Audit Logs** | Basic | Standard | Extended (Compliance) |

## Commercial Roadmap

### Phase 1: Self-Service (Q1)
*   Launch **Essential** and **Professional** via Stripe Checkout.
*   Users can upgrade/downgrade in the Billing Portal.

### Phase 2: Enterprise Sales (Q2)
*   Manual provisioning for **Enterprise** tenants (using the SuperAdmin console).
*   Invoicing via Stripe Invoicing (Bank Transfer support).

### Phase 3: Marketplace (Q3)
*   Monetize the **Community Marketplace** (Templates/Training) as an additional revenue stream (Transaction Fee model).
