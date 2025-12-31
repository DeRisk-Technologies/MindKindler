// src/marketplace/types.ts

import { PolicyRule } from "@/types/schema";

export type InstallActionType = 'createPolicyRule' | 'createTrainingModule' | 'createMapping' | 'createRolloutChecklist';

export interface InstallAction {
    type: InstallActionType;
    payload: any; // e.g. PolicyRule sans ID
}

export interface MarketplaceManifest {
    id: string;
    name: string;
    description: string;
    version: string;
    regionTags: string[];
    actions: InstallAction[];
}
