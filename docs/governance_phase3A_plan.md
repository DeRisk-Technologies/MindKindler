# Governance & Knowledge Vault Phase 3A Plan

## Objective
Establish the foundation for the "Knowledge Vault" – a multi-tenant, role-aware repository for Rulebooks, Professional Reports, and Personal Rules. This phase includes data modeling, basic ingestion (upload + mock chunking), and a retrieval query interface ("Ask the Vault").

## 1. Data Model Strategy (Firestore)

### Collections
*   **`knowledgeDocuments`**: Metadata for source files.
    *   `id`: string
    *   `type`: 'rulebook' | 'report'
    *   `title`: string
    *   `tenantId`: string
    *   `ownerId`: string (uploadedBy)
    *   `visibility`: 'private' | 'team' | 'public'
    *   `storagePath`: string
    *   `status`: 'uploaded' | 'processing' | 'indexed' | 'error'
    *   `metadata`: { authority?, effectiveDate?, caseTags?, schoolName? }
    *   `createdAt`: timestamp
*   **`knowledgeChunks`**: Text segments for vector search (Mock Vector Store).
    *   `id`: string
    *   `documentId`: string
    *   `content`: string
    *   `embedding`: number[] (Mocked)
    *   `tags`: string[]
*   **`personalRules`**: EPP-specific structured rules.
    *   `id`: string
    *   `ownerId`: string
    *   `title`: string
    *   `description`: string
    *   `category`: string
    *   `severity`: 'info' | 'warning' | 'critical'
    *   `visibility`: 'private' | 'team'
*   **`knowledgeQueries`**: Audit log of questions asked.
    *   `id`: string
    *   `userId`: string
    *   `query`: string
    *   `timestamp`: timestamp
    *   `sourcesUsed`: string[] (documentIds)

## 2. Ingestion Pipeline (Mocked for Phase 3A)
*   **Upload**: User uploads file to Firebase Storage (simulated or real if config allows, fallback to local object URL for demo).
*   **Processing**:
    1.  Create `knowledgeDocument` with status 'processing'.
    2.  Simulate text extraction (use dummy text based on filename).
    3.  Simulate Chunking (split dummy text).
    4.  Simulate Embedding (random vectors).
    5.  Save `knowledgeChunks`.
    6.  Update `knowledgeDocument` status to 'indexed'.

## 3. Retrieval & RAG (Ask the Vault)
*   **Query**: User inputs text.
*   **Retrieval**:
    *   Filter chunks by permissions (visibility/tenant).
    *   Simple keyword match or mock similarity search on `knowledgeChunks`.
*   **Generation**:
    *   Construct prompt with top 3 chunks.
    *   Return "canned" AI response citing those chunks.

## 4. UI Structure (`src/app/dashboard/intelligence/...`)
*   **`/` (Hub)**: Navigation cards to Vault, Library, Rules, Query.
*   **`/vault`**: Rulebook management (Admin/Upload/List).
*   **`/library`**: Professional Library (EPP Upload/List).
*   **`/rules`**: Personal Rules Editor (CRUD).
*   **`/query`**: "Ask the Vault" chat interface.

## 5. Security & Permissions
*   **Rulebooks**: Visible to all in tenant. Upload by Admin only.
*   **Reports**: Visibility controlled by `visibility` field. Upload by EPP.
*   **Personal Rules**: Visible to Owner (or Team if shared).

## Execution Steps
1.  **Schema**: Update `src/types/schema.ts`.
2.  **Services**: Implement `src/ai/knowledge/ingest.ts` and `src/ai/knowledge/retrieve.ts` (Mock services).
3.  **Components**: Create `DocumentUploadDialog`.
4.  **Pages**: Implement Hub, Vault, Library, Rules, Query pages.
5.  **Integration**: Link navigation.
6.  **Verify**: Manual test of upload -> index -> query flow.

## Manual Test Checklist
- [ ] Upload a "Rulebook" (Admin view).
- [ ] Upload a "Report" (EPP view).
- [ ] Create a "Personal Rule".
- [ ] Go to "Ask the Vault", ask a question, and verify it "cites" the uploaded documents.
