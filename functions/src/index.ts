// functions/src/index.ts (Snippet to register export function)

import { onCall } from "firebase-functions/v2/https";
import * as aiReports from "./ai/generateClinicalReport";
import { exportReport as exportReportHandler } from "./reports/exportReport";

// ... existing exports
export const generateClinicalReport = onCall({ region: 'europe-west3' }, aiReports.handler);
export const exportReport = exportReportHandler; // Register new function
