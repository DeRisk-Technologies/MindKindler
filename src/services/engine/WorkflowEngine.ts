
import { db } from "@/lib/firebase";
import { GuardianEvent, Case } from "@/types/schema";
import { ComplianceWorkflow } from "@/marketplace/types";
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

interface WorkflowAction {
    type: 'create_case' | 'notify_dsl' | 'escalate_incident' | 'schedule_job';
    payload: Record<string, any>;
}

export class WorkflowEngine {
    
    /**
     * The core brain. Receives a raw event, finds applicable workflows, 
     * evaluates their conditions, and executes actions.
     */
    async evaluateTrigger(event: GuardianEvent): Promise<WorkflowAction[]> {
        const workflows = await this.getWorkflowsForTrigger(event.tenantId, event.eventType);
        const actions: WorkflowAction[] = [];

        for (const flow of workflows) {
            const isMatch = await this.evaluateCondition(flow.condition, event);
            if (isMatch) {
                // If it has a delay (e.g. 30 mins), we don't execute immediately.
                // We schedule it.
                if (flow.slaHours && flow.slaHours > 0) {
                    actions.push({
                        type: 'schedule_job',
                        payload: {
                            workflowId: flow.id,
                            executeAt: new Date(Date.now() + flow.slaHours * 60 * 60 * 1000).toISOString(),
                            event
                        }
                    });
                } else {
                    const action = await this.executeAction(flow.action, event);
                    if (action) actions.push(action);
                }
            }
        }

        return actions;
    }

    /**
     * 1.1.1 "Unexplained Absence" Implementation
     * 
     * Example JSON Rule for UK First Day Calling:
     * {
     *   "id": "uk_first_day_calling",
     *   "name": "First Day Calling Protocol",
     *   "trigger": "attendance_logged",
     *   "condition": "event.context.status == 'unexplained' && event.context.time > '09:00'",
     *   "action": "create_case",
     *   "slaHours": 0.5 // 30 minutes delay check
     * }
     */
    private async evaluateCondition(conditionScript: string, event: GuardianEvent): Promise<boolean> {
        // Security Note: In a real "Country OS", we'd use a safe expression parser like 'mathjs' or 'jexl'.
        // For this V1 architecture, we will implement specific hardcoded handlers that map to the JSON config keys.
        
        // UK Rule: "status == unexplained"
        if (conditionScript.includes("status == 'unexplained'")) {
            return event.context?.status === 'unexplained';
        }

        // Generic fallback or expanded parser would go here
        return false;
    }

    private async executeAction(actionKey: string, event: GuardianEvent): Promise<WorkflowAction | null> {
        switch (actionKey) {
            case 'create_case':
                return {
                    type: 'create_case',
                    payload: {
                        title: `Unexplained Absence: ${event.context.studentName}`,
                        description: `Statutory Alert (KCSIE/EYFS): Student marked absent without explanation. Verify immediately.`,
                        priority: 'High',
                        subjectId: event.subjectId
                    }
                };
            case 'notify_dsl':
                return {
                    type: 'notify_dsl',
                    payload: {
                        message: `Safeguarding Alert: ${event.context.reason}`,
                        studentId: event.subjectId
                    }
                };
            default:
                console.warn(`Unknown action: ${actionKey}`);
                return null;
        }
    }

    // --- Data Access Layer ---

    private async getWorkflowsForTrigger(tenantId: string, eventType: string): Promise<ComplianceWorkflow[]> {
        // 1. Try fetching from Tenant's installed config
        // In reality, this would be cached in memory or Redis for performance
        try {
            const settingsRef = doc(db, `tenants/${tenantId}/settings/compliance`);
            const snap = await getDoc(settingsRef);
            
            if (snap.exists()) {
                const allFlows = snap.data().workflows as ComplianceWorkflow[];
                return allFlows.filter(w => w.trigger === eventType);
            }
        } catch (e) {
            console.error("Failed to load tenant workflows", e);
        }

        return [];
    }

    /**
     * Called by the Scheduler Cloud Function when the timeDelay expires.
     * Re-evaluates to see if the condition is STILL true (e.g. did they explain the absence?)
     */
    async executeScheduledWorkflow(job: any) {
        const { event, workflowId } = job;
        
        // 1. Check current state (e.g. is it still unexplained?)
        // If the secretary updated the record to 'Illness' (authorized) in the last 30 mins, we abort.
        const currentState = await this.fetchCurrentState(event.subjectId);
        
        if (currentState.status === 'unexplained') {
             // 2. Trigger the escalation action
             const action = await this.executeAction('create_case', event);
             if (action && action.type === 'create_case') {
                 // Write to Firestore
                 await addDoc(collection(db, `tenants/${event.tenantId}/cases`), {
                     ...action.payload,
                     tenantId: event.tenantId,
                     status: 'active',
                     createdAt: serverTimestamp(),
                     createdBy: 'system_workflow_engine'
                 });
             }
        }
    }

    private async fetchCurrentState(subjectId: string): Promise<any> {
        // Mock implementation. In prod, this queries the 'attendance' subcollection
        return { status: 'unexplained' }; 
    }
}
