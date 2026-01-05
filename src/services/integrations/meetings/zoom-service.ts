// src/services/integrations/meetings/zoom-service.ts

import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { Appointment } from "@/types/schema";

export class MeetingService {
    
    /**
     * Create a secure video meeting via Cloud Function.
     * Ensures PII is stripped from title/description before sending to Zoom/Teams.
     */
    static async createMeeting(appointmentId: string, platform: 'zoom' | 'teams'): Promise<string> {
        try {
            const createFn = httpsCallable(functions, 'securelyCreateMeetingV2');
            const result = await createFn({ appointmentId, platform });
            return (result.data as any).meetingUrl;
        } catch (e) {
            console.error("Meeting creation failed", e);
            throw new Error("Failed to provision secure meeting link.");
        }
    }
}
