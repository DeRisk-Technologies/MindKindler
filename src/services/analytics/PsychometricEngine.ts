
import { PsychometricConfig } from "@/marketplace/types";

// Types for flexible test definitions
export interface ScoreResult {
    rawScore: number;
    standardScore: number;
    percentile: number;
    confidenceInterval: [number, number]; // [low, high]
    classification: string;
    isDeviation: boolean;
    isSignificantDeviation: boolean;
}

export interface DiscrepancyResult {
    scoreA: string; // Name of index A
    scoreB: string; // Name of index B
    diff: number;
    isSignificant: boolean;
    isRare: boolean; // e.g., <5% base rate
    message: string;
}

export class PsychometricEngine {
    
    private config: PsychometricConfig;

    constructor(config: PsychometricConfig) {
        this.config = config;
    }

    /**
     * Converts a raw score to a standardized score using a lookup table (Norms).
     * 
     * @param rawScore The raw test score
     * @param normTable A record mapping Raw Score -> Standard Score
     * @param sem Standard Error of Measurement for this specific subtest (default 3)
     */
    public calculateStandardScore(
        rawScore: number, 
        normTable: Record<number, number>, 
        sem: number = 3
    ): ScoreResult {
        
        // 1. Look up Standard Score (SS)
        // Fallback: If raw score exceeds table, clamp to min/max
        const standardScore = normTable[rawScore] || this.extrapolateScore(rawScore, normTable);
        
        // 2. Calculate Percentile Rank (Normal Distribution Approximation)
        const zScore = (standardScore - this.config.standardScoreMean) / this.config.standardScoreSD;
        const percentile = this.zScoreToPercentile(zScore);

        // 3. Calculate Confidence Interval
        // CI = Score +/- (z_critical * SEM)
        // For 95% CI, z_critical is approx 1.96
        const zCritical = 1.96; 
        const marginOfError = zCritical * sem;
        
        const ciLow = Math.round(standardScore - marginOfError);
        const ciHigh = Math.round(standardScore + marginOfError);

        // 4. Deviation Analysis (Dynamic Thresholds)
        const isDeviation = standardScore <= this.config.deviationThresholds.mild;
        const isSignificantDeviation = standardScore <= this.config.deviationThresholds.significant;

        // 5. Classification Label (UK WISC-V Standard)
        const classification = this.getClassificationLabel(standardScore);

        return {
            rawScore,
            standardScore,
            percentile: parseFloat(percentile.toFixed(1)),
            confidenceInterval: [ciLow, ciHigh],
            classification,
            isDeviation,
            isSignificantDeviation
        };
    }

    /**
     * Section 2.2: Ipsative Analysis (Discrepancy)
     * Compares two index scores to find specific learning difficulties.
     * 
     * @param scoreA Value of first index (e.g., VCI)
     * @param labelA Name of first index
     * @param scoreB Value of second index (e.g., WMI)
     * @param labelB Name of second index
     * @param significanceThreshold Difference required for statistical significance (usually 15)
     * @param rareThreshold Difference required for clinical rarity (usually 23)
     */
    public calculateDiscrepancy(
        scoreA: number, 
        labelA: string, 
        scoreB: number, 
        labelB: string,
        significanceThreshold: number = 15, // 1 SD default
        rareThreshold: number = 23 // <5% base rate default
    ): DiscrepancyResult | null {
        
        const diff = Math.abs(scoreA - scoreB);
        const isSignificant = diff >= significanceThreshold;
        
        if (!isSignificant) return null;

        const isRare = diff >= rareThreshold;
        const higher = scoreA > scoreB ? labelA : labelB;
        const lower = scoreA > scoreB ? labelB : labelA;

        return {
            scoreA: labelA,
            scoreB: labelB,
            diff,
            isSignificant,
            isRare,
            message: `Significant discrepancy found. ${higher} is ${diff} points higher than ${lower}. This suggests a specific processing deficit rather than global delay.`
        };
    }

    /**
     * UK Classification Labels (WISC-V)
     */
    private getClassificationLabel(ss: number): string {
        if (ss >= 130) return "Extremely High";
        if (ss >= 120) return "Very High";
        if (ss >= 110) return "High Average";
        if (ss >= 90) return "Average";
        if (ss >= 80) return "Low Average";
        if (ss >= 70) return "Very Low / Borderline";
        return "Extremely Low";
    }

    private zScoreToPercentile(z: number): number {
        // Approximation of the cumulative distribution function for standard normal distribution
        if (z < -6.5) return 0;
        if (z > 6.5) return 100;

        const factK = 1 / (Math.sqrt(2 * Math.PI));
        let sum = 0;
        const term = 1 / (1 + 0.2316419 * Math.abs(z));
        const k = term;
        
        const a1 = 0.319381530;
        const a2 = -0.356563782;
        const a3 = 1.781477937;
        const a4 = -1.821255978;
        const a5 = 1.330274429;

        const poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
        const result = 1 - factK * Math.exp(-z * z / 2) * poly;

        return (z >= 0 ? result : 1 - result) * 100;
    }

    private extrapolateScore(raw: number, table: Record<number, number>): number {
        // Simple clamp for V1
        const scores = Object.values(table);
        const maxSS = Math.max(...scores);
        const minSS = Math.min(...scores);
        // If raw is higher than any key, return maxSS
        // If raw is lower, return minSS
        // In real psychometrics, we'd throw an error or use extended norms
        return raw > Math.max(...Object.keys(table).map(Number)) ? maxSS : minSS;
    }
}
