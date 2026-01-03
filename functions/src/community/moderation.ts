import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';

const db = admin.firestore();

// PII Regex Patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
  phone: /\b(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

const TOXIC_WORDS = ['offensive_word_1', 'offensive_word_2']; 

interface ModerationResult {
  flagged: boolean;
  reason?: string;
  redactedContent?: string;
}

function scanContent(content: string): ModerationResult {
  let redacted = content;
  let flagged = false;
  const reasons: string[] = [];

  for (const [type, regex] of Object.entries(PII_PATTERNS)) {
    if (regex.test(content)) {
      flagged = true;
      reasons.push(`Potential ${type} PII detected`);
      redacted = redacted.replace(regex, '[REDACTED]');
    }
  }

  const lower = content.toLowerCase();
  for (const word of TOXIC_WORDS) {
    if (lower.includes(word)) {
        flagged = true;
        reasons.push('Toxic language detected');
    }
  }

  return {
    flagged,
    reason: reasons.join(', '),
    redactedContent: redacted
  };
}

const region = "europe-west3";

export const onPostCreated = onDocumentCreated({
    document: "tenants/{tenantId}/forum/threads/{threadId}/posts/{postId}",
    region
}, async (event) => {
    const snap = event.data;
    if (!snap) return;

    const newData = snap.data();
    const { tenantId, threadId, postId } = event.params;
    const content = newData.content || '';

    const moderation = scanContent(content);
    const updates: any = {};

    if (moderation.flagged) {
      updates['content'] = moderation.redactedContent;
      updates['moderation'] = {
        flagged: true,
        reason: moderation.reason,
        flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
        originalContentHidden: true
      };
      console.log(`[Guardian] Flagged post ${postId} in thread ${threadId}: ${moderation.reason}`);
    }

    if (Object.keys(updates).length > 0) {
        await snap.ref.update(updates);
    }

    const threadRef = db.doc(`tenants/${tenantId}/forum/threads/${threadId}`);
    await threadRef.update({
      'metrics.replies': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPostId: postId,
      lastPostBy: newData.authorId
    });
});

export const onThreadCreated = onDocumentCreated({
    document: "tenants/{tenantId}/forum/threads/{threadId}",
    region
}, async (event) => {
      const snap = event.data;
      if (!snap) return;
      
      const newData = snap.data();
      const content = newData.content || '';
      const title = newData.title || '';

      const modContent = scanContent(content);
      const modTitle = scanContent(title);

      if (modContent.flagged || modTitle.flagged) {
          await snap.ref.update({
              title: modTitle.redactedContent,
              content: modContent.redactedContent,
              moderation: {
                  flagged: true,
                  reason: [modContent.reason, modTitle.reason].filter(Boolean).join(', '),
                  flaggedAt: admin.firestore.FieldValue.serverTimestamp()
              },
              isPublic: false 
          });
      }
});
