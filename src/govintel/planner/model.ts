// src/govintel/planner/model.ts

import { GovSnapshot } from "@/analytics/govSnapshots";

export interface PlanningAssumption {
  id?: string;
  tenantId: string;
  avgHoursPerAssessment: number;
  avgHoursPerInterventionPlan: number;
  avgHoursPerSafeguardingIncident: number;
  hoursPerEppPerMonth: number;
  salaryMonthlyEpp: number;
  trainingCostPerStaffPerMonth: number;
  targetBacklogReductionPercent: number;
}

export const DEFAULT_ASSUMPTIONS: PlanningAssumption = {
    tenantId: "default",
    avgHoursPerAssessment: 2.0,
    avgHoursPerInterventionPlan: 6.0,
    avgHoursPerSafeguardingIncident: 8.0,
    hoursPerEppPerMonth: 120,
    salaryMonthlyEpp: 2500,
    trainingCostPerStaffPerMonth: 20,
    targetBacklogReductionPercent: 50
};

export interface PlanningScenario {
  id?: string;
  tenantId: string;
  name: string;
  baseSnapshotRef: string;
  modifiers: {
      referralIncreasePercent: number;
      staffingIncreaseEpps: number;
      budgetCapAnnual?: number;
  };
  computedOutputs?: PlannerOutputs;
  status: 'draft' | 'saved';
  createdAt?: string;
}

export interface PlannerOutputs {
    totalWorkHours: number;
    requiredEpps: number;
    staffingBudgetMonthly: number;
    totalBudgetAnnual: number;
    backlogClearanceMonths: number;
    capacityGap: number; // Positive = Surplus, Negative = Shortage
}

export function computeWorkload(snapshot: GovSnapshot, assumptions: PlanningAssumption): number {
    const assessmentHours = snapshot.metrics.assessments.total * assumptions.avgHoursPerAssessment;
    const interventionHours = snapshot.metrics.interventions.active * assumptions.avgHoursPerInterventionPlan;
    const safeguardingHours = snapshot.metrics.safeguarding.total * assumptions.avgHoursPerSafeguardingIncident;
    
    return assessmentHours + interventionHours + safeguardingHours;
}

export function runSimulation(
    snapshot: GovSnapshot, 
    assumptions: PlanningAssumption, 
    modifiers: PlanningScenario['modifiers'],
    currentStaffCount: number = 5 // Mock baseline staff
): PlannerOutputs {
    
    // Apply Modifiers
    const growthFactor = 1 + (modifiers.referralIncreasePercent / 100);
    const projectedWorkHours = computeWorkload(snapshot, assumptions) * growthFactor;

    const projectedStaff = currentStaffCount + modifiers.staffingIncreaseEpps;
    const totalCapacity = projectedStaff * assumptions.hoursPerEppPerMonth;

    const capacityGap = totalCapacity - projectedWorkHours;
    const requiredEpps = Math.ceil(projectedWorkHours / assumptions.hoursPerEppPerMonth);

    // Budget
    const staffingBudgetMonthly = projectedStaff * assumptions.salaryMonthlyEpp;
    const totalBudgetAnnual = (staffingBudgetMonthly * 12) * 1.25; // +25% overhead

    // Backlog (Mock backlog as 20% of total work for demo)
    const backlogHours = projectedWorkHours * 0.2; 
    let backlogClearanceMonths = 999;
    if (capacityGap > 0) {
        backlogClearanceMonths = backlogHours / (capacityGap * (assumptions.targetBacklogReductionPercent/100));
    }

    return {
        totalWorkHours: projectedWorkHours,
        requiredEpps,
        staffingBudgetMonthly,
        totalBudgetAnnual,
        backlogClearanceMonths,
        capacityGap
    };
}
