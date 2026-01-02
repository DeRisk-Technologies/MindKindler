# Monitoring & Alerting Guide (Case Management)

## 1. Key Metrics (Firestore `case_telemetry`)

### SLA Breach Rate
*   **Query:** Count of `slaBreached` events vs Total `caseCreated` events.
*   **Threshold:** Alert if Breach Rate > 10%.
*   **Action:** Check workload assignment or adjust SLA rules.

### Auto-Creation Volume
*   **Query:** Count of `caseAutoCreated` events per hour.
*   **Threshold:** Alert if > 2x daily average (indicates potential alert storm).

### Triage Latency
*   **Query:** Avg time between `caseCreated` and `caseUpdated` (status change from `triage`).
*   **Target:** < 4 hours.

## 2. Cloud Monitoring Configuration (Example)

```json
{
  "metrics": [
    {
      "name": "case_escalation_count",
      "filter": "resource.type=\"cloud_function\" AND textPayload:\"SLA Breached\""
    }
  ],
  "alerts": [
    {
      "condition": "rate(case_escalation_count) > 5 per minute",
      "notification": "PagerDuty_EPP_Ops"
    }
  ]
}
```

## 3. Telemetry Structure
Every critical action logs:
- `tenantId`
- `userId` (Actor)
- `metadata` (Diffs, Linkages)
- `timestamp`
