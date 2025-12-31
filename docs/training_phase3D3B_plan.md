# Training Phase 3D-3B Plan: Training & Micro-Learning System

## Objective
Implement a comprehensive **Training & Micro-Learning System** that bridges the gap between identifying needs (via analytics) and delivering solutions (via learning modules). This includes content creation, assignment, tracking, and reporting.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **TrainingModule (New):**
    - `id`, `tenantId`, `title`, `audience`, `level`, `category`, `format`
    - `contentBlocks`: { type, content }[]
    - `evidenceCitations`[], `verified`, `trustScore`
    - `status`: 'draft' | 'published'
- [ ] **LearningPath (New):**
    - `id`, `title`, `modules`: { moduleId, order }[]
    - `audience`, `prerequisites`
- [ ] **TrainingAssignment (New):**
    - `id`, `assignedToId`, `learningPathId`, `moduleId`, `status`, `dueDate`
- [ ] **TrainingCompletion (New):**
    - `id`, `userId`, `moduleId`, `completedAt`, `evidenceAcknowledged`
- [ ] **TrainingNeed (New - Optional/Computed):**
    - Structure for analytics output (category, severity, suggestedModules).

## 2. Training Library UI
**Path:** `src/app/dashboard/training` (New Module)

- [ ] **Library (`/library/page.tsx`):**
    - Browse/Search modules.
    - Filter by Audience/Category.
    - "Create Module" Dialog.
- [ ] **Module Detail (`/library/[id]/page.tsx`):**
    - View content blocks (Text, Bullets, Citations).
    - "Mark Complete" button.
- [ ] **Learning Paths (`/paths/page.tsx`):**
    - Create/View curated sequences of modules.

## 3. Training Needs Analytics
**Path:** `src/analytics/trainingNeeds.ts`

- [ ] **Logic:**
    - `detectTrainingNeeds(outcomeStats)`: Returns list of high-priority categories based on "Worsening" trends or specific high-frequency tags.
- [ ] **Integration:**
    - Display in `SchoolOutcomesPage` (`src/app/dashboard/insights/schools/page.tsx`).
    - Action: "Generate Training Plan" -> Creates assignments.

## 4. Assignments & Tracking
**Path:** `src/app/dashboard/training/assignments/page.tsx`

- [ ] **My Assignments:** List tasks assigned to the current user.
- [ ] **Admin View (`/admin/page.tsx`):**
    - Completion rates.
    - Overdue list.

## 5. Creator Tools (AI & Evidence)
- [ ] **"Draft with AI":** Button in Create Module dialog.
    - Mock generation of content blocks based on title/category.
    - Auto-attach verified evidence citations (reuse `retrieveContext`).
- [ ] **Guardian Check:**
    - Trigger `training.publish` event on publish.
    - Check for PII or missing citations.

## 6. Execution Steps
1.  **Schema**: Define all new types.
2.  **Library UI**: Build the Browse and Detail views.
3.  **Assignments**: Build the Assignment management UI.
4.  **Analytics**: Implement needs detection.
5.  **Integration**: Add "Training Needs" widget to School Dashboard.
6.  **Creator**: Add "Draft with AI" to module creator.

## Manual Test Checklist
- [ ] **Create Module**: Use "Draft with AI" to make a "Trauma Informed Care" module. Verify citations are attached. Publish.
- [ ] **Assign**: Assign this module to a test user.
- [ ] **Complete**: Log in as test user, go to Assignments, open module, click "Complete".
- [ ] **Verify**: Check Admin dashboard for completion stat.
- [ ] **Needs**: Check School Outcomes dashboard for "Recommended Training" suggestions based on mock outcome data.
