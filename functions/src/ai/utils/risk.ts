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
  /\bcutting\b/i, // Word boundary to avoid "cutting paper" false positives if possible, though context matters
  /attempted\s+suicide/i,
  /kill\s+myself/i,
  /want\s+to\s+die/i,
  /sexually?\s+abus(e|ed|ing)/i,
  /\bmolest(ed|ing)?\b/i,
  /\brape(d)?\b/i,
  /hit\s+me/i,
  /beat\s+me/i,
  /\babuse(d)?\b/i,
  /running\s+away/i,
  /threat\s+to\s+harm/i
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

  // Additional pass for global matches if needed, but exec finds the first. 
  // For risk detection, finding ANY is sufficient to trigger escalation.
  // We return all unique pattern hits.

  return {
    found: matches.length > 0,
    matches,
  };
}
