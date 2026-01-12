// functions/src/ai/utils/consultation-formatter.ts

export function formatConsultationHistory(consultations: any[]): string {
    if (!consultations || consultations.length === 0) return "No consultation history available.";
  
    return consultations.map((session, index) => {
      // 1. Summarize the Transcript (Voice of the Child)
      const studentVoice = session.transcript
        ?.filter((t: any) => t.speaker === 'Student')
        .map((t: any) => `"${t.text}"`)
        .join(' ');
  
      // 2. Extract Clinical Insights (The "Brain")
      const insights = session.insights
        ?.map((i: any) => `- ${i.type.toUpperCase()}: ${i.text} (Confidence: ${i.confidence})`)
        .join('\n');
  
      // 3. Extract Intervention Plan (The "Plan")
      const interventions = session.interventionPlan
        ?.map((p: any) => `- ${p.programName}: ${p.rationale}`)
        .join('\n');
  
      return `
      --- SESSION ${index + 1} (${session.date}) ---
      MODE: ${session.mode}
      THEMES:
      ${insights}
  
      STUDENT VOICE (Direct Quotes):
      ${studentVoice}
  
      AGREED INTERVENTIONS:
      ${interventions}
  
      MANUAL CLINICAL NOTES:
      ${session.manualClinicalNotes?.join('\n')}
      `;
    }).join('\n\n');
  }