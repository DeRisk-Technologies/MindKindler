# Mock Inventory & RAG Production Plan

## Summary
Scanning the codebase revealed **over 80 mock patterns** ranging from simple `setTimeout` delays in UI components to complete mock logic for AI, indexing, and data sync functions.

- **Total Mocks Found**: ~85
- **Mock Types**: 
  - `ai-mock`: ~35 (Genkit flows, retrieval, scoring)
  - `extraction-mock`: ~15 (OCR, document parsing)
  - `ui-placeholder`: ~25 (Missing charts, filters, drag-and-drop)
  - `auth-mock`: ~5 (Partner/User context)
  - `test-helper`: ~5 (Jest mocks)
- **RAG Status**: **Partial / Mocked**. The system has a scaffold for RAG (`ingest.ts`, `retrieve.ts`, `knowledgeChunks` collection) but lacks a real Vector Database connection, embeddings generation, and semantic retrieval logic.

**Top RAG Gaps**:
1.  **No Vector DB**: Retrieval uses `Math.random()` or keyword matches instead of dense vector search.
2.  **Mock Embeddings**: Ingestion generates random number arrays instead of using an embedding model.
3.  **No Reranker**: Results are not semantically re-ranked for relevance.

---

## A. Mock Inventory

### AI & Intelligence
| File | Mock Type | Severity | Description | Recommended Replacement | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `functions/src/ai/processUploadedDocument.ts` | `extraction-mock` | **Critical** | Mocks OCR processing with `setTimeout` and hardcoded text return. | Integrate Google Document AI (v1beta3) or Vision API for real OCR. | M |
| `functions/src/ai/analyzeConsultationInsight.ts` | `ai-mock` | High | Uses placeholder logic if logic is uncommented or partial. | Ensure `genkit` flow is fully wired with valid prompts and error handling. | S |
| `src/ai/knowledge/ingest.ts` | `ai-mock` | **Critical** | Generates random number arrays for embeddings. | Use `vertex-ai-embeddings` model (Gecko) to generate real vectors. | M |
| `src/ai/knowledge/retrieve.ts` | `ai-mock` | **Critical** | Returns random chunks or keyword matches. | Connect to Vertex Matching Engine or Pinecone/Weaviate for vector search. | L |
| `functions/src/ai/generateAssessmentContent.ts` | `ai-mock` | Medium | Basic prompt, lacks rigorous error handling/types. | Refine Genkit flow with Zod schema validation and retry logic. | S |
| `src/ai/flows/grading.ts` | `ai-mock` | High | Calculates score based on word count / 5. | Use LLM-as-a-Judge pattern: Prompt model with rubric to grade student answer. | M |

### Data & Uploads
| File | Mock Type | Severity | Description | Recommended Replacement | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/components/dashboard/data-ingestion/document-uploader.tsx` | `extraction-mock` | High | `uploadFileToStorage` mocks upload with `setTimeout`. | Use `firebase/storage` SDK `uploadBytes` to real bucket. | S |
| `functions/src/reports/exportReport.ts` | `extraction-mock` | High | Generates PDF from simple buffer string `Buffer.from(...)`. | Use `pdfmake` or `puppeteer` to render actual HTML content to PDF. | M |
| `src/services/upload-service.ts` | `extraction-mock` | Medium | `compressImage` returns original file (no-op). | Implement `browser-image-compression` logic. | S |
| `functions/src/upload/bulkImport.ts` | `extraction-mock` | Medium | Validates manifest but doesn't trigger real file processing loops. | Implement PubSub/Task Queue to process files asynchronously. | M |

### Integrations
| File | Mock Type | Severity | Description | Recommended Replacement | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `functions/src/integrations/syncEngine.ts` | `integration-mock` | Medium | Hardcoded `mockGrades` array. | Fetch from external API (Canvas/PowerSchool) via configured connector. | L |
| `src/integrations/sms/gateway.ts` | `notification-mock` | Low | Logs SMS to console. | Integrate Twilio or MessageBird API. | S |
| `src/integrations/connectors/oneroster/index.ts` | `integration-mock` | Medium | Mock API response for OneRoster. | Implement real OneRoster OAuth/REST flow. | L |

### UI & Dashboard
| File | Mock Type | Severity | Description | Recommended Replacement | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/app/dashboard/page.tsx` | `ui-placeholder` | Low | Hardcoded `caseload` array. | Fetch `cases` collection query where `assignedTo == user.uid`. | S |
| `src/components/dashboard/dashboard-alerts.tsx` | `ui-placeholder` | Low | Mock alerts list. | Query `alerts` collection. | S |
| `src/app/dashboard/analytics/page.tsx` | `ui-placeholder` | Low | Hardcoded chart data. | Implement aggregation queries on `assessment_results`. | M |

---

## B. RAG Inspection & Gaps

### Existing RAG-related Files
*   `src/ai/knowledge/ingest.ts`: Defines `knowledgeChunks` schema and has a placeholder `embedding` field.
*   `src/ai/knowledge/retrieve.ts`: Defines `retrieveContext` signature but uses mock timeouts and return values.
*   `src/govintel/copilot.ts`: Calls `retrieveContext` (currently mock).
*   `src/govintel/procurement/generator.ts`: Calls `retrieveContext`.

### RAG Gaps Table

| Gap | Severity | Impact | Recommended Plan | Effort |
| :--- | :--- | :--- | :--- | :--- |
| **No Embeddings** | **Critical** | Search is effectively random/broken. | Implement Vertex AI Embeddings (Gecko) in Cloud Function `ingestDocument`. | M |
| **No Vector DB** | **Critical** | Cannot scale beyond ~50 docs. | Deploy Vertex AI Vector Search (Matching Engine) or Pinecone. | L |
| **No Indexing** | **Critical** | Uploaded docs are never searchable. | Create `functions/src/knowledge/indexDocument.ts` triggered on upload. | M |
| **No Reranking** | Medium | Low precision in retrieval. | Add Cross-Encoder reranking step after top-K retrieval. | S |
| **No Tenant Isolation**| High | Data leak risk between schools. | Enforce `namespace` in Vector DB or filter by `tenantId` metadata. | S |

---

## C. Recommended Vertex AI RAG Production Plan

### 1. Embeddings & Vector Storage
*   **Model:** `text-embedding-004` (Vertex AI).
*   **Store:** **Firestore Vector Search** (Preview) or **Vertex AI Vector Search**.
    *   *Recommendation:* **Firestore Vector Search** (via `firebase-extensions/firestore-vector-search`) for simplicity and tight integration if scale < 1M vectors.
    *   *Alt:* **Pinecone** (Serverless) for managed ease if Firestore Vector is too limited.

### 2. Ingestion Pipeline
1.  **Trigger:** `onDocumentCreated` (status='uploaded').
2.  **Processing:**
    *   Extract Text (Document AI).
    *   Chunking: RecursiveCharacterTextSplitter (chunkSize: 1000, overlap: 200).
    *   Embed: Call Vertex AI `embedText` for each chunk.
3.  **Storage:**
    *   Write chunks to `tenants/{tid}/knowledgeChunks`.
    *   Write vector to Vector Store (with metadata: `docId`, `tenantId`, `chunkIndex`, `text`).

### 3. Retrieval Pipeline
1.  **Function:** `functions/src/ai/retrieveContext.ts` (Callable).
2.  **Logic:**
    *   Embed query string.
    *   Query Vector Store (Filter: `tenantId == request.auth.tenantId`).
    *   Get Top-20 results.
    *   (Optional) Rerank using `semantic-ranker`.
    *   Return Top-5 results with `trustScore`.

### 4. Security
*   **Isolation:** ALL vector queries MUST include a filter for `tenantId`.
*   **Encryption:** Managed by Google Cloud/Vector Provider.

### 5. Cost & Ops
*   **Estimation:** Embedding costs are low ($0.000025/1k chars). Vector storage is the main cost driver.
*   **Feature Flag:** `ENABLE_RAG` per tenant to control rollout.

---
**Status:** Mocks identified. RAG implementation is currently skeletal and requires a dedicated backend engineering phase.
