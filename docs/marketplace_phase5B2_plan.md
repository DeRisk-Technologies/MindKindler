# Marketplace Phase 5B-2 Plan: Template Marketplace & Publishing

## Objective
Expand the Integration Marketplace to support a full **Template Marketplace** ecosystem. This allows experts (publishers) to create, review, and sell reusable content (Assessments, Policies, Training) to other tenants. This phase introduces "Certified" content, licensing models, and a publishing workflow.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts` (Update)

- [ ] **MarketplaceItem (New):**
    - `id`, `type` ('assessment', 'policy', 'training', 'report', 'evidence')
    - `title`, `description`, `version`, `status` ('draft', 'review', 'published')
    - `authorId`, `publisherName`, `certified` (boolean)
    - `pricing`: { `model` ('free', 'paid'), `amount` }
    - `installManifest`: `MarketplaceManifest` (Reuse existing schema)
    - `stats`: { `installs`, `rating` }
- [ ] **MarketplaceReview (New):**
    - `id`, `itemId`, `userId`, `rating` (1-5), `comment`.
- [ ] **MarketplacePurchase (New):**
    - `id`, `tenantId`, `itemId`, `status` ('active', 'expired').

## 2. Publishing Workflow
**Roles:**
- `Publisher`: Can create drafts and submit for review.
- `Reviewer/Admin`: Can approve/reject and toggle "Certified".

**Flow:**
1.  **Draft**: Publisher creates item -> `status: draft`.
2.  **Submit**: Publisher clicks "Submit" -> `status: review`.
3.  **Approve**: Admin reviews content -> `status: published`.

## 3. UI Implementation
**Path:** `src/app/dashboard/marketplace` (Extensions)

- [ ] **Templates Store (`/templates/page.tsx`)**:
    - Browse items.
    - Filters: Certified, Price, Type.
- [ ] **Item Detail (`/templates/[itemId]/page.tsx`)**:
    - "Install" (if free/purchased) or "Request Purchase" button.
    - Reviews list.
    - Certified Badge display.
- [ ] **Publisher Studio (`/publisher/page.tsx`)**:
    - List my items.
    - Create New Item wizard (define manifest manually for now).
- [ ] **Review Queue (`/review/page.tsx`)**:
    - Admin only. Approve/Reject pending items.

## 4. Installer Integration
- [ ] Reuse `src/marketplace/installer.ts`.
- [ ] Update `installPack` to check `MarketplacePurchase` status if item is paid.

## 5. Execution Steps
1.  **Schema**: Add Item, Review, Purchase types.
2.  **UI**: Build Publisher Studio (Create Draft).
3.  **UI**: Build Review Queue (Approve).
4.  **UI**: Build Templates Store (Browse & Install).
5.  **Logic**: Implement Purchase Request (Mock).
6.  **Logic**: Implement Rating submission.

## Manual Test Checklist
- [ ] **Publish**: Go to Publisher Studio. Create "Advanced Math Assessment". Submit.
- [ ] **Review**: Go to Review Queue. Approve "Advanced Math Assessment". Mark as Certified.
- [ ] **Browse**: Go to Templates Store. Verify item appears with "Certified" badge.
- [ ] **Install**: Click Install. Verify it appears in Assessment Builder.
- [ ] **Rate**: Go back to Item Detail. Submit a 5-star review. Verify avg rating updates (mock calc).
