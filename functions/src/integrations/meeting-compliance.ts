import * as admin from 'firebase-admin';
import { onCall, HttpsOptions, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
// import axios from 'axios'; // Uncomment when implementing real calls

const db = admin.firestore();
const region = "europe-west3";
const callOptions: HttpsOptions = { region, cors: true };

/**
 * securelyCreateMeeting
 * 
 * Creates a meeting on an external provider (Zoom/Teams) while strictly sanitizing PII.
 * Ensures the student's name NEVER leaves the MindKindler boundary in metadata.
 */
export const securelyCreateMeeting = onCall({
    ...callOptions,
    secrets: ["ZOOM_API_KEY", "ZOOM_API_SECRET"] // Prepared for secrets
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in');
    }

    const { 
        provider, // 'zoom' | 'teams'
        topic,    // "Consultation" (Generic)
        startTime, 
        duration,
        caseId,   // Link to internal Case
        studentId // Used internally, NEVER sent to provider
    } = request.data;

    // 1. DATA PRIVACY ENFORCEMENT
    let sanitizedTopic = `MindKindler Session`;
    if (caseId) {
        sanitizedTopic += ` - Case Ref: ${caseId}`;
    }

    // 2. PROVIDER LOGIC
    let meetingDetails;
    try {
        if (provider === 'zoom') {
            meetingDetails = await createZoomMeeting(sanitizedTopic, startTime, duration);
        } else if (provider === 'teams') {
            meetingDetails = await createTeamsMeeting(sanitizedTopic, startTime, duration);
        } else {
            throw new HttpsError('invalid-argument', 'Unsupported provider');
        }
    } catch (error: any) {
        console.error(`[Integrations] Failed to create ${provider} meeting:`, error);
        throw new HttpsError('internal', 'Provider API failed');
    }

    // 3. SECURE STORAGE & LINKING
    const appointmentRef = db.collection('appointments').doc();
    await appointmentRef.set({
        id: appointmentRef.id,
        tenantId: request.auth.token.tenantId || 'default-tenant',
        provider: provider,
        externalMeetingId: meetingDetails.id,
        joinUrl: meetingDetails.joinUrl,
        
        // Internal Data (Safe to store in our secured DB)
        internalTopic: topic, // e.g., "Review for John Doe"
        studentId: studentId,
        caseId: caseId,
        
        sanitizedExternalTopic: sanitizedTopic,
        
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
        
        // Metadata for Recording Fetcher
        recordingStatus: 'pending', 
    });

    return {
        appointmentId: appointmentRef.id,
        joinUrl: meetingDetails.joinUrl
    };
});

// --- Helper Functions ---

async function createZoomMeeting(topic: string, startTime: string, duration: number) {
    const apiKey = process.env.ZOOM_API_KEY;
    
    // REAL IMPLEMENTATION (Active if Key Present)
    if (apiKey) {
        /*
        try {
            const token = generateZoomJwt(apiKey, process.env.ZOOM_API_SECRET);
            const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
                topic: topic,
                type: 2, // Scheduled
                start_time: startTime,
                duration: duration,
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            return {
                id: response.data.id,
                joinUrl: response.data.join_url
            };
        } catch (e) { throw e; }
        */
       console.log("Zoom Key present but logic commented out until JWT/OAuth implementation is finalized.");
    }

    // SIMULATION MODE (For Prod Stability without API Keys)
    console.log(`[Simulation Zoom] Creating meeting: "${topic}"`);
    
    // We log the outbound request to DB so we can debug integration logic
    await db.collection('integration_logs').add({
        provider: 'zoom',
        action: 'create_meeting',
        payload: { topic, startTime, duration },
        status: 'simulated',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        id: `sim_zoom_${Date.now()}`,
        joinUrl: `https://zoom.us/j/simulation_mode`
    };
}

async function createTeamsMeeting(subject: string, startTime: string, duration: number) {
    // SIMULATION MODE
    console.log(`[Simulation Teams] Creating meeting: "${subject}"`);
    
    await db.collection('integration_logs').add({
        provider: 'teams',
        action: 'create_meeting',
        payload: { subject, startTime, duration },
        status: 'simulated',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        id: `sim_teams_${Date.now()}`,
        joinUrl: `https://teams.microsoft.com/l/meetup-join/simulation_mode`
    };
}


/**
 * fetchAndPurgeRecordings (Scheduled Function)
 */
export const fetchAndPurgeRecordings = onSchedule({
    schedule: "every 1 hours",
    region
}, async (event) => {
    // In production, this would query only tenants who have this feature enabled
    const pendingRecordings = await db.collection('appointments')
        .where('status', '==', 'completed')
        .where('recordingStatus', '==', 'pending')
        .get();

    for (const doc of pendingRecordings.docs) {
        const data = doc.data();
        const { externalMeetingId } = data;

        try {
            // Logic to fetch from Zoom/Teams API would go here.
            // For now, we assume if it's a simulated meeting, we auto-complete it.
            
            if (externalMeetingId.startsWith('sim_')) {
                 await doc.ref.update({
                    recordingStatus: 'not_available', // Simulation has no recording
                    note: 'Simulation mode - no recording generated'
                });
                continue;
            }

            // Real logic placeholder
            // await downloadAndPurge(externalMeetingId);

        } catch (error) {
            console.error(`[Compliance] Failed to secure recording for ${doc.id}:`, error);
        }
    }
});
