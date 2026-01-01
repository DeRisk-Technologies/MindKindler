# Report Writing - Monitoring & Dashboard

## 1. Key Metrics (Cloud Monitoring / BigQuery)

### AI Performance
*   **Draft Latency (p95):** Time from request to draft complete. Target < 15s.
*   **Repair Rate:** Percentage of generations requiring JSON repair. Target < 5%.
    *   `count(event == 'aiRepairAttempted') / count(event == 'aiDraftRequested')`
*   **Hallucination Rate:** (Manual Audit) % of drafts where user deletes > 50% of text.

### Usage & Business
*   **Completion Rate:** `Drafts Created` vs `Reports Signed`.
*   **Evidence Usage:** Avg citations per report. Target > 3.
*   **Redaction Usage:** % of shares using `PARENT_SAFE` vs `FULL`.

## 2. Alerting Policies

| Alert Name | Condition | Severity | Channel |
| :--- | :--- | :--- | :--- |
| **High AI Failure Rate** | `aiDraftSuccess` rate < 90% over 5m | Critical | PagerDuty |
| **High Repair Rate** | `aiRepairAttempted` > 10% over 1h | Warning | Slack (#eng-alerts) |
| **SLA Breach** | Report Draft > 48h in `review` status | Info | Email (Manager) |

## 3. Dashboard Queries (Firestore / BigQuery Export)

```sql
-- Average Latency for Report Generation
SELECT 
  AVG(metadata.latencyMs) as avg_latency,
  APPROX_QUANTILES(metadata.latencyMs, 100)[OFFSET(95)] as p95_latency
FROM `report_telemetry`
WHERE event = 'aiDraftSuccess'
AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY);
```

```sql
-- Top Used Templates
SELECT 
  metadata.templateType, 
  COUNT(*) as usage_count
FROM `report_telemetry`
WHERE event = 'aiDraftRequested'
GROUP BY 1
ORDER BY 2 DESC;
```
