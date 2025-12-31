# Plan Phase 6A-1: Localization & Translation Infrastructure

## 1. Overview
MindKindler must support multiple languages (locales) to serve diverse regions (e.g., UK, DACH, Gulf, Nigeria). This phase establishes the foundational infrastructure for i18n (internationalization) and translation management. It prioritizes offline capabilities and multi-tenant configuration (allowing different tenants to prefer different languages or terminology).

## 2. Goals & Non-Goals

### Goals
- **Infrastructure:** Implement a lightweight, client-side i18n engine compatible with offline PWA usage.
- **Data Model:** Store locale configuration and translation overrides in Firestore per tenant.
- **Resolution:** Define strict logic for resolving the active locale (User > Tenant > App Default).
- **Admin UI:** Basic "Localization Settings" for Admins to set defaults and upload terminology.
- **AI Awareness:** Ensure the AI Co-Pilot knows the active language context.

### Non-Goals
- **Full UI Translation:** We will not translate every single UI string in this phase; we will only set up the *mechanism* to do so.
- **RTL Layout:** Right-to-Left (Arabic) layout adjustments are out of scope (Phase 6B).
- **Automatic Translation API:** Integration with Google Translate API for real-time translation is out of scope (Phase 6C).

## 3. i18n Strategy (Offline-First)

We will use a lightweight, bespoke React Context solution rather than a heavy library to maintain strict control over offline caching and Firestore sync.

### Architecture
- **`LocaleContext`:** Global provider wrapping the app. Loads locale from LocalStorage (immediate) -> Auth Profile (async) -> Tenant Config (async).
- **`useTranslation` Hook:** Exposes `t('key', default)` and `locale`.
- **Glossary Layer:** A "Glossary" map is fetched from Firestore (`tenants/{id}/glossary/{locale}`) and merged into the base dictionary. This allows a tenant to rename "Student" to "Learner" or "Patient".

### Resolution Order
1.  **User Preference:** Stored in `users/{uid}.settings.locale` (e.g., `de-DE`).
2.  **Tenant Default:** Stored in `tenants/{id}.settings.defaultLocale` (e.g., `en-GB` vs `en-US`).
3.  **App Fallback:** Hardcoded `en-US` in code.

## 4. Data Model (Firestore)

### Collection: `tenants/{tenantId}/settings/localization`
Single document per tenant defining rules.
```typescript
interface TenantLocalization {
  defaultLocale: string; // e.g. 'en-GB'
  supportedLocales: string[]; // ['en-GB', 'es-ES', 'fr-FR']
  terminology: Record<string, string>; // { "Student": "Pupil", "District": "Local Authority" }
}
```

### Collection: `translations/{locale}/packs/{namespace}`
Global/System-level translation packs (read-only for most).
- `translations/en-US/packs/common`: { "welcome": "Welcome", ... }
- `translations/de-DE/packs/common`: { "welcome": "Willkommen", ... }

### Collection: `tenants/{tenantId}/translations/{locale}`
Tenant-specific overrides.
- Overrides system keys.
- Useful for highly specific regional terms not covered by global glossary.

## 5. Security Model
- **Read:** Authenticated users can read global `translations` and their own `tenants/{id}` settings.
- **Write:** Only `admin` role can modify `tenants/{id}/settings` or upload overrides.

## 6. UI/UX Plan

### A. Language Switcher
- **Location:** Settings Page & Login Footer.
- **Component:** Simple Dropdown (Flag + Name).

### B. Admin Localization Panel
- **Route:** `/dashboard/settings/localization`
- **Features:**
    - Set Default Locale.
    - Enable/Disable Languages.
    - Terminology Editor (Table: "Original Term" -> "Custom Term").

## 7. AI Language Awareness
The `src/ai/genkit.ts` (or equivalent AI flow) must accept a `locale` parameter.
- **Prompt Injection:** "You are an assistant. Reply in {locale}. Use the following terminology overrides: {glossary_json}."
- This ensures generated reports match the UI language.

## 8. Migration Strategy
1.  **Seed:** Create initial `en-US` and `es-ES` (Spanish) sample packs in `translations` collection.
2.  **Bootstrap:** On app load, if no user locale is set, detect browser locale, then check tenant default.

## 9. Staged Implementation Plan

### Stage 1: Core Engine
- Create `src/lib/i18n.ts` (types and utilities).
- Create `src/contexts/locale-context.tsx`.
- Implement `useTranslation` hook.

### Stage 2: Firestore & Data
- Update `src/types/schema.ts` with localization interfaces.
- Create seed script for standard language packs (`src/lib/scripts/seed-i18n.ts`).

### Stage 3: UI Integration
- Add `<LocaleProvider>` to `layout.tsx`.
- Create `LanguageSwitcher` component.
- Create `/dashboard/settings/localization` page for Admins.

### Stage 4: Terminology/Glossary Logic
- Implement the "Glossary Merge" logic in the context.
- UI for Admins to add terms (e.g., Rename "Case" to "File").

### Stage 5: AI Integration
- Update `src/ai/dev.ts` (or mock AI service) to accept `locale`.
- Verify generated text respects the requested language.

## 10. Acceptance Criteria
- [ ] User can switch language in Settings; change persists on reload.
- [ ] "Student" term changes to "Pupil" if Tenant Glossary is configured.
- [ ] Admin can select which languages are available for their tenant.
- [ ] AI Mock response returns text in the selected language (simulated).
