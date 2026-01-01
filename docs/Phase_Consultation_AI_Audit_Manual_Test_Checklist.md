# Manual Test Checklist: Consultation AI Audit

## 1. Safety & Risk Detection
- [ ] **Risk Keyword Test:**
    1. Start a consultation.
    2. Speak or type: "The student mentioned self-harm yesterday."
    3. Verify a red "Risk" card appears in the Insights panel.
    4. Verify a new Case is created in "Cases" with "Critical" severity.
    5. Verify `ai_provenance` log shows `isRisk: true`.

## 2. Report Generation
- [ ] **Standard Report:**
    1. Complete a session with ~500 words of transcript.
    2. Click "End & Report".
    3. Verify the report editor opens with structured SOAP content.
    4. Check `ai_provenance` for a successful `generateClinicalReport` entry.

- [ ] **Schema Repair:**
    1. (Mock Test) Force the AI to return invalid JSON.
    2. Verify the system retries and eventually produces valid output or fails gracefully with a user-friendly error.

## 3. Glossary Application
- [ ] **Terminology Check:**
    1. Configure tenant glossary: "Student" -> "Learner".
    2. Generate insights for a transcript containing "The student is struggling."
    3. Verify the Insight card reads "The Learner is struggling."

## 4. Transcript Chunking
- [ ] **Long Session:**
    1. Paste a very long text (>5000 chars) into the transcript area (or simulate).
    2. Trigger analysis.
    3. Verify multiple `chunkIndex` references appear in the insights list.
    4. Ensure no insights are cut off mid-sentence.

## 5. Provenance & Monitoring
- [ ] **Audit Log:**
    1. Go to Firestore console > `ai_provenance`.
    2. Verify recent entries contain `prompt`, `responseText`, `latencyMs`, and `glossaryReplacements`.
