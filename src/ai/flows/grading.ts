// src/ai/flows/grading.ts

/**
 * MOCK AI Service for Phase 1 & 2.
 * Replace with actual Google Genkit / Gemini 1.5 Flash calls in Phase 3.
 */

interface ScoreResponse {
  score: number;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  highlights: string[];
}

interface SummaryResponse {
  summary: string;
  risks: string[];
  recommendations: string[];
}

export async function scoreOpenTextResponse(
  questionText: string,
  studentAnswer: string,
  maxPoints: number = 10
): Promise<ScoreResponse> {
  // Simulate AI Latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Improved mock logic for Phase 2
  const wordCount = studentAnswer.split(" ").length;
  let mockScore = Math.min(maxPoints, Math.floor(wordCount / 5)); // 1 point per 5 words
  if (mockScore < 1) mockScore = 1;

  let mockReasoning = "";
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  let highlights: string[] = [];

  if (wordCount < 10) {
      mockReasoning = "Response is very brief and lacks detail. Consider asking for elaboration.";
      confidence = 'high';
  } else if (wordCount > 50) {
      mockReasoning = "Detailed response demonstrating good understanding. Key concepts identified.";
      confidence = 'high';
      highlights = ["good understanding", "concepts identified"];
  } else {
      mockReasoning = "Adequate response, covers basic points but could be more specific.";
      confidence = 'medium';
  }

  // Randomly assign low confidence for testing
  if (Math.random() > 0.8) {
      confidence = 'low';
      mockReasoning += " (Note: AI is uncertain about the context of this answer)";
  }

  return {
    score: mockScore,
    reasoning: `AI Suggestion: ${mockReasoning}`,
    confidence,
    highlights
  };
}

export async function generateAssessmentSummary(
  assessmentTitle: string,
  responses: { question: string; answer: string; score?: number }[]
): Promise<SummaryResponse> {
  // Simulate AI Latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  const lowScores = responses.filter(r => (r.score || 0) < 3).length;
  
  return {
    summary: `The assessment "${assessmentTitle}" was completed with varying degrees of success. The participant demonstrated strengths in some areas but struggled with ${lowScores} questions. Overall, the profile suggests a need for targeted intervention.`,
    risks: [
      lowScores > 2 ? "High risk of academic delay" : "Moderate anxiety indicators",
      "Potential attention span issues observed in long-form answers"
    ],
    recommendations: [
      "Schedule a follow-up 1:1 session.",
      "Recommend 'Focus & Attention' workshop.",
      "Review home environment support."
    ]
  };
}
