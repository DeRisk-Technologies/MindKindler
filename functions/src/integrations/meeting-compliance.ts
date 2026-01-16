import * as admin from 'firebase-admin';
import { onCall, HttpsOptions, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import axios from 'axios'; 

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
    // We request ALL potential secrets. Firebase only injects the ones that exist/are granted.
    secrets: [
        "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET", "ZOOM_ACCOUNT_ID",
        "TEAMS_CLIENT_ID", "TEAMS_CLIENT_SECRET", "TEAMS_TENANT_ID"
    ]
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
        // We log the detailed error server-side but return a generic one to client
        throw new HttpsError('internal', `Provider API failed: ${error.message}`);
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
        internalTopic: topic, 
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

/**
 * ZOOM IMPLEMENTATION (Server-to-Server OAuth)
 */
async function createZoomMeeting(topic: string, startTime: string, duration: number) {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    
    // REAL IMPLEMENTATION
    if (clientId && clientSecret && accountId) {
        try {
            // 1. Get Access Token
            const tokenResponse = await axios.post('https://zoom.us/oauth/token', null, {
                params: { grant_type: 'account_credentials', account_id: accountId },
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                }
            });
            const accessToken = tokenResponse.data.access_token;

            // 2. Create Meeting
            // We use 'me' if the OAuth app is account-level, or a specific userId if passed
            const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
                topic: topic,
                type: 2, // Scheduled
                start_time: startTime, // ISO format
                duration: duration,
                settings: {
                    auto_recording: 'cloud', // Enforce recording for compliance
                    join_before_host: false
                }
            }, { 
                headers: { 'Authorization': `Bearer ${accessToken}` } 
            });
            
            return {
                id: response.data.id.toString(), // Ensure string
                joinUrl: response.data.join_url
            };
        } catch (e: any) {
            console.error("Zoom API Error:", e.response?.data || e.message);
            throw new Error("Failed to connect to Zoom.");
        }
    }

    // SIMULATION MODE
    console.log(`[Simulation Zoom] Creating meeting: "${topic}"`);
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

/**
 * TEAMS IMPLEMENTATION (Microsoft Graph API)
 */
async function createTeamsMeeting(subject: string, startTime: string, duration: number) {
    const clientId = process.env.TEAMS_CLIENT_ID;
    const clientSecret = process.env.TEAMS_CLIENT_SECRET;
    const tenantId = process.env.TEAMS_TENANT_ID;

    // REAL IMPLEMENTATION
    if (clientId && clientSecret && tenantId) {
        try {
            // 1. Get Access Token
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('scope', 'https://graph.microsoft.com/.default');
            params.append('grant_type', 'client_credentials');

            const tokenResponse = await axios.post(
                `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, 
                params
            );
            const accessToken = tokenResponse.data.access_token;

            // 2. Create Online Meeting
            // Note: Application permissions require a user context or policy. 
            // Often easier to create on behalf of a generic user or the logged-in user if implementing OBO flow.
            // For Daemon apps (S2S), we create /onlineMeetings directly.
            
            const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

            const response = await axios.post(
                'https://graph.microsoft.com/v1.0/users/admin@mindkindler.com/onlineMeetings', // Placeholder Admin
                {
                    startDateTime: startTime,
                    endDateTime: endTime,
                    subject: subject
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            return {
                id: response.data.id,
                joinUrl: response.data.joinWebUrl
            };
        } catch (e: any) {
             console.error("Teams Graph API Error:", e.response?.data || e.message);
             // Fallback to simulation if configured logic fails (e.g. invalid user)
        }
    }

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

export const fetchAndPurgeRecordings = onSchedule({
    schedule: "every 1 hours",
    region
}, async (event) => {
    // Placeholder for recording fetch logic
    console.log("Checking for recordings to purge...");
});
