# Partner Phase 5C-1 Plan: Partner Program Foundation

## Objective
Establish the **Partner Program**, allowing external organizations (consultancies, NGOs) to join the ecosystem. This foundation supports partner profiles, certification workflows, referral tracking, and deal registration, enabling a scalable channel model.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts` (Update)

- [ ] **PartnerOrg (New):**
    - `id`, `orgName`, `status` ('applied', 'approved', 'suspended')
    - `certificationLevel` ('none', 'bronze', 'silver', 'gold')
    - `specialties`[], `regionsServed`[]
- [ ] **PartnerUser (New):**
    - `userId`, `partnerId`, `role` ('admin', 'consultant')
- [ ] **ReferralCode (New):**
    - `code`, `partnerId`, `status`
- [ ] **DealRegistration (New):**
    - `id`, `partnerId`, `prospectName`, `stage` ('lead', 'won'), `estimatedValue`

## 2. Administration UI (Marketplace Admin)
**Path:** `src/app/dashboard/partners` (New Module)

- [ ] **List Page (`/page.tsx`)**:
    - View all partners.
    - Filter by Status/Level.
- [ ] **Detail Page (`/[partnerId]/page.tsx`)**:
    - Approve/Suspend partner.
    - Assign Certification Level (Gold/Silver).
    - View Referrals/Deals.

## 3. Partner Portal UI (Partner User)
**Path:** `src/app/dashboard/partner-portal` (New Module)

- [ ] **Dashboard (`/page.tsx`)**:
    - "My Profile" card.
    - "My Referral Code".
    - "Deal Registrations" summary.
- [ ] **Apply Page (`/apply/page.tsx`)**:
    - Public/Unauthenticated route (or logged-in user conversion).
    - Form: Org Name, Website, Specialties.

## 4. Integration
- [ ] **Marketplace**: Update `MarketplaceItem` display logic to show "Certified Partner" badge if `publisherOrg` linked to a Gold/Silver partner.

## 5. Execution Steps
1.  **Schema**: Add Partner types.
2.  **UI**: Build Application Form.
3.  **UI**: Build Admin Management List.
4.  **UI**: Build Partner Dashboard (Deals/Referrals).
5.  **Integration**: Check certification status in Marketplace Item view.

## Manual Test Checklist
- [ ] **Apply**: Go to `/dashboard/partner-portal/apply`. Submit "Acme Education".
- [ ] **Approve**: Go to `/dashboard/partners`. Find "Acme". Approve and set level to "Gold".
- [ ] **Portal**: Go to `/dashboard/partner-portal`. Verify status is "Approved" and Gold badge is visible.
- [ ] **Deal**: Register a deal "School X". Verify it appears in the list.
- [ ] **Publish**: Create a marketplace item as this user. Verify it shows "Gold Partner" badge in the store.
