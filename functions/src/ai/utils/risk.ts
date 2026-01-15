// functions/src/ai/utils/risk.ts

export interface RiskMatch {
  match: string;
  index: number;
}

export interface RiskCheckResult {
  found: boolean;
  matches: RiskMatch[];
}

// Conservative, high-priority risk patterns
const RISK_PATTERNS = [
  /suicid(e|al)/i,
  /self[- ]harm/i,
  /\bcutting\b/i, // Word boundary to avoid "cutting paper" false positives
  /attempted\s+suicide/i,
  /kill\s+myself/i,
  /end\s+it\s+all/i,
  /want\s+to\s+die/i,
  /overdose/i,
  /sexually?\s+abus(e|ed|ing)/i,
  /\bmolest(ed|ing)?\b/i,
  /\brape(d)?\b/i,
  /hit\s+me/i,
  /beat\s+me/i,
  /\babuse(d)?\b/i,
  /scared\s+to\s+go\s+home/i,
  /running\s+away/i,
  /threat\s+to\s+harm/i
];

export const SAFEGUARDING_KEYWORDS = [
  "suicide", "kill myself", "end it all", "hurt myself", 
  "cutting", "overdose", "abuse", "hit me", "scared to go home"
];

export function runRiskRegex(text: string): RiskCheckResult {
  if (!text) return { found: false, matches: [] };

  const matches: RiskMatch[] = [];

  RISK_PATTERNS.forEach((pattern) => {
    const match = pattern.exec(text);
    if (match) {
      matches.push({
        match: match[0],
        index: match.index,
      });
    }
  });

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Enhanced check for immediate safeguarding risks.
 * Used by the Consultation Cockpit and Report Engine.
 */
export function analyzeImmediateRisk(text: string): { isCritical: boolean; matches: string[] } {
  if (!text) return { isCritical: false, matches: [] };
  
  // We use the regex engine for better accuracy (word boundaries) than simple string includes
  const regexResult = runRiskRegex(text);
  
  // Also check the explicit list provided in requirements to be doubly sure
  const lowerText = text.toLowerCase();
  const simpleMatches = SAFEGUARDING_KEYWORDS.filter(word => lowerText.includes(word));
  
  // Merge results unique
  const allMatches = Array.from(new Set([
    ...regexResult.matches.map(m => m.match), 
    ...simpleMatches
  ]));

  return {
    isCritical: allMatches.length > 0,
    matches: allMatches
  };
}
