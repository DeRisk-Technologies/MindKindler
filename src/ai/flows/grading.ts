// src/ai/flows/grading.ts (Client Service)

import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export interface GradeResult {
  score: number;
  reasoning: string;
  feedback: string;
  confidence: 'high' | 'medium' | 'low';
}

// Canonical production function
export async function gradeOpenText(
  tenantId: string,
  question: string,
  studentAnswer: string,
  rubric: string | null = null,
  maxPoints: number = 5
): Promise<GradeResult> {
  const gradeFn = httpsCallable(functions, 'gradeOpenText');
  
  try {
    const result = await gradeFn({
        tenantId,
        question,
        studentAnswer,
        rubric,
        maxPoints
    });
    
    return result.data as GradeResult;
  } catch (e) {
    console.error("AI Grading Failed", e);
    return {
        score: 0,
        reasoning: "AI service unavailable.",
        feedback: "Please grade manually.",
        confidence: 'low'
    };
  }
}

// Aliases for compatibility with existing imports
export const scoreOpenTextResponse = gradeOpenText;

export async function generateAssessmentSummary(results: any[]) {
    // This is a placeholder for a future summary function
    return "Summary: Assessment complete with multiple responses.";
}
