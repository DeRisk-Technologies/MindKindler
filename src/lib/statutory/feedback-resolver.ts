// src/lib/statutory/feedback-resolver.ts

import { DraftReport, ReportSectionName } from "../../types/report";
import { DraftComment, FeedbackStatus } from "../../types/feedback";

/**
 * Result of an apply operation.
 * Returns the new immutable DraftReport and the updated Comment status.
 */
export interface ResolutionResult {
    updatedDraft: DraftReport;
    updatedComment: DraftComment;
    auditLog: string;
}

/**
 * The Resolution Engine.
 * 
 * Handles the logic of "Triaging" feedback.
 * - Accept: Modifies the report text.
 * - Reject: Ignores the suggestion but logs the decision.
 * - Modify: Accepts a variation of the suggestion.
 */
export class FeedbackResolver {

    /**
     * Applies a moderation decision to a piece of feedback.
     * 
     * @param draft - The current state of the report.
     * @param comment - The incoming feedback comment.
     * @param action - The EPP's decision ('accept' | 'reject').
     * @param modification - (Optional) The specific text to insert if different from the comment.
     */
    applyFeedback(
        draft: DraftReport, 
        comment: DraftComment, 
        action: 'accept' | 'reject', 
        modification?: string
    ): ResolutionResult {

        // 1. Clone objects (Immutability)
        const newDraft: DraftReport = JSON.parse(JSON.stringify(draft));
        const newComment: DraftComment = { ...comment };
        const now = new Date().toISOString();
        let auditLog = '';

        // 2. Handle Logic
        if (action === 'reject') {
            newComment.status = 'rejected';
            newComment.resolvedAt = now;
            auditLog = `Feedback rejected by EPP. Original: "${comment.originalText}"`;
        } 
        else if (action === 'accept') {
            newComment.status = 'accepted';
            newComment.resolvedAt = now;
            
            // Determine the text to use (Modification > Comment > Original)
            const textToInsert = modification || comment.commentText;
            newComment.resolutionText = textToInsert;

            // Perform Replacement in the specific section
            const sectionKey = comment.targetSection as ReportSectionName;
            const currentContent = newDraft.narrativeSections[sectionKey];

            if (currentContent) {
                // Simple string replacement. 
                // In production, might need fuzzy matching or index-based splicing if text changed.
                if (currentContent.includes(comment.originalText)) {
                    newDraft.narrativeSections[sectionKey] = currentContent.replace(comment.originalText, textToInsert);
                    auditLog = `Feedback accepted. Replaced "${comment.originalText}" with "${textToInsert}".`;
                } else {
                    // Fallback: If original text not found (e.g. already edited), append note or throw warning.
                    // For safety, we accept the status but might fail the auto-apply.
                    auditLog = `Feedback accepted but auto-replace failed (text not found). Manual edit required.`;
                    newComment.resolutionNote = "Auto-replace failed. Please verify text manually.";
                }
            } else {
                 auditLog = `Target section '${sectionKey}' not found in draft.`;
            }
        }

        return {
            updatedDraft: newDraft,
            updatedComment: newComment,
            auditLog
        };
    }
}
