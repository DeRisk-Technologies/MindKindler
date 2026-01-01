# EPP Upload Portal - Monitoring & Dashboard

## 1. Key Metrics

### Health & Reliability
*   **Extraction Success Rate:** `count(extraction_success) / (count(extraction_success) + count(extraction_failed))` (Target > 95%)
*   **Bulk Job Health:** Failure rate of bulk jobs.
*   **Mobile Sync Rate:** Percentage of offline captures successfully synced.

### Operational Efficiency
*   **Human Correction Rate:** How many fields are edited in Staging before approval?
    *   `avg(metadata.editDistance)` in `staging_item_approved` events.
*   **Deduplication Savings:** Number of uploads blocked or merged due to dedupe.

## 2. Dashboard Queries (BigQuery Export)

```sql
-- Extraction Success Rate over 24h
SELECT 
  countif(event = 'extraction_success') / count(*) as success_rate
FROM `upload_telemetry`
WHERE event IN ('extraction_success', 'extraction_failed')
AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY);
```

```sql
-- Top Categories Uploaded
SELECT 
  metadata.category, 
  COUNT(*) as total
FROM `upload_telemetry`
WHERE event = 'upload_completed'
GROUP BY 1
ORDER BY 2 DESC;
```

## 3. Alerts

| Alert Name | Condition | Severity | Channel |
| :--- | :--- | :--- | :--- |
| **High Extraction Failure** | Failure Rate > 10% (5m window) | Critical | PagerDuty |
| **Bulk Job Stuck** | Job Status 'uploading' > 1h | Warning | Slack |
| **Dedupe Spike** | > 50 duplicates in 1h (Possible retry loop) | Info | Email |
