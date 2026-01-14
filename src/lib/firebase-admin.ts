// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'mindkindler-84fcf' // Explicit ID
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
