# MindKindler: Community + Blog + Wiki Implementation Plan

## 1. Overview
MindKindler is a community forum, blog, and wiki designed to strengthen the platform by building trust, lowering support costs, feeding Model Ops, and enabling product marketing.

## 2. High-Level Goals
1.  **Safe Spaces:** Private tenant communities and a moderated global public community.
2.  **Trustworthy Knowledge:** Convert community content into a vetted Wiki (RAG source).
3.  **Operational Integration:** Link forum threads/wiki to Student360, Cases, Reports.
4.  **Scalable Moderation:** Guardian AI checks, escalation flows, GDPR-safe controls.
5.  **Value Generation:** CPD certification, monetized content, reputation systems.

## 3. Principal Features

### 3.1 Forum (Community)
*   **Modes:** Tenant-private, Global public, Topic-specific boards.
*   **Core:** Boards, Threads, Rich-text (Markdown), Tags, Search, Reactions.
*   **Safety:** PII blocking via Guardian AI, Private threads for case discussions.
*   **Integration:** Link to Case/Student360, "Promote to Wiki".

### 3.2 Blog
*   **Core:** Multi-author, Scheduled publishing, SEO, Comments.
*   **Admin:** Editorial calendar, Approval workflows.

### 3.3 Wiki (Knowledge Vault)
*   **Core:** Collaborative pages, Versioning, Metadata (Quality Score), Templates.
*   **AI:** RAG source with trust scores.

## 4. Data Model (Firestore)

### Collections
*   `tenants/{tenantId}/forum/categories/{catId}`
*   `tenants/{tenantId}/forum/threads/{threadId}`
*   `tenants/{tenantId}/forum/threads/{threadId}/posts/{postId}`
*   `tenants/{tenantId}/wiki/pages/{pageId}`
*   `tenants/{tenantId}/blog/posts/{postId}`
*   `tenants/{tenantId}/users/{userId}/reputation/{repId}`
*   `global/forum/...` (public)
*   `global/wiki/pages/{pageId}`
*   `ai_provenance/{provId}`

### Key Interfaces
*   **Thread:** `title`, `categoryId`, `createdBy`, `isPublic`, `tenantScope`, `tags`, `status`.
*   **Post:** `author`, `content`, `attachments`, `aiSummaryProvId`.
*   **WikiPage:** `title`, `slug`, `sections`, `authors`, `status`, `qualityScore`, `evidence`.

## 5. Implementation Phases

### Phase 1: MVP (4-8 weeks)
*   [ ] **Forum:** Tenant-private, Create Thread/Post, Reply, Reactions.
*   [ ] **Blog:** Create Draft -> Publish.
*   [ ] **Wiki:** Create Page -> Version -> Publish.
*   [ ] **Safety:** Automated Guardian AI PII checks (blocking).
*   [ ] **Integration:** Forum thread -> Wiki draft promotion.
*   [ ] **Data:** Firestore rules for tenant isolation.

### Phase 2: Advanced (8-12 weeks)
*   [ ] Moderation dashboard & reporting.
*   [ ] Reputation system & badges.
*   [ ] Document upload + OCR.
*   [ ] RAG indexing.

### Phase 3: Mature (12+ weeks)
*   [ ] Public community.
*   [ ] Advanced wiki templates & marketplace.
*   [ ] Full RAG with re-ranking.
*   [ ] Monetization.

## 6. Technical Stack
*   **Frontend:** Next.js / React + TipTap (Markdown).
*   **Backend:** Firestore, Cloud Functions.
*   **AI:** Vertex AI (Guardian), Vector Search.
*   **Search:** Algolia + Vector DB.

## 7. Execution Steps (Immediate)
1.  Define TypeScript interfaces for Forum, Blog, and Wiki.
2.  Configure Firestore rules (basic structure).
3.  Scaffold Next.js routes (`/dashboard/community`, `/dashboard/wiki`, `/dashboard/blog`).
4.  Implement basic Thread list and Detail view.
