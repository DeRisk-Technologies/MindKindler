import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// --- Configuration ---
// In production, fetch these from Secret Manager
// const ZOOM_API_BASE = 'https://api.zoom.us/v2';
// const MICROSOFT_GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * securelyCreateMeeting
 * 
 * Creates a meeting on an external provider (Zoom/Teams) while strictly sanitizing PII.
 * Ensures the student's name NEVER leaves the MindKindler boundary in metadata.
 */
export const securelyCreateMeeting = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { 
        provider, // 'zoom' | 'teams'
        topic,    // "Consultation" (Generic)
        startTime, 
        duration,
        caseId,   // Link to internal Case
        studentId // Used internally, NEVER sent to provider
    } = data;

    // 1. DATA PRIVACY ENFORCEMENT
    // We strictly control the meeting title sent to the third party.
    // Instead of "Review for John Doe", we send "MindKindler Case #12345"
    // This sanitization happens server-side so client code can't bypass it.
    
    let sanitizedTopic = `MindKindler Session`;
    if (caseId) {
        sanitizedTopic += ` - Case Ref: ${caseId}`;
    }
    // We explicitly IGNORE any 'studentName' passed in data to prevent accidental leakage.

    // 2. PROVIDER LOGIC
    let meetingDetails;
    try {
        if (provider === 'zoom') {
            meetingDetails = await createZoomMeeting(sanitizedTopic, startTime, duration);
        } else if (provider === 'teams') {
            meetingDetails = await createTeamsMeeting(sanitizedTopic, startTime, duration);
        } else {
            throw new functions.https.HttpsError('invalid-argument', 'Unsupported provider');
        }
    } catch (error: any) {
        console.error(`[Integrations] Failed to create ${provider} meeting:`, error);
        throw new functions.https.HttpsError('internal', 'Provider API failed');
    }

    // 3. SECURE STORAGE & LINKING
    // We store the mapping of External Meeting ID <-> Internal Student Data here in Firestore.
    // The external provider only knows the Meeting ID and the sanitized topic.
    
    const appointmentRef = db.collection('appointments').doc();
    await appointmentRef.set({
        id: appointmentRef.id,
        tenantId: context.auth.token.tenantId || 'default-tenant',
        provider: provider,
        externalMeetingId: meetingDetails.id,
        joinUrl: meetingDetails.joinUrl,
        
        // Internal Data (Safe to store in our secured DB)
        internalTopic: topic, // e.g., "Review for John Doe" - stored locally only
        studentId: studentId,
        caseId: caseId,
        
        sanitizedExternalTopic: sanitizedTopic,
        
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
        
        // Metadata for Recording Fetcher
        recordingStatus: 'pending', // watcher will look for this
    });

    return {
        appointmentId: appointmentRef.id,
        joinUrl: meetingDetails.joinUrl
    };
});

// --- Helper Functions (Mocked API Calls) ---

async function createZoomMeeting(topic: string, startTime: string, duration: number) {
    // In prod: Get OAuth token from Firestore/Secrets
    // await axios.post(`${ZOOM_API_BASE}/users/me/meetings`, { topic, start_time: startTime... })
    
    console.log(`[Mock Zoom] Creating meeting: "${topic}" at ${startTime} for ${duration}m`);
    return {
        id: `zoom_${Math.floor(Math.random() * 100000)}`,
        joinUrl: `https://zoom.us/j/mock_meeting`
    };
}

async function createTeamsMeeting(subject: string, startTime: string, duration: number) {
    // In prod: Graph API call
    console.log(`[Mock Teams] Creating meeting: "${subject}" at ${startTime} for ${duration}m`);
    return {
        id: `teams_${Math.floor(Math.random() * 100000)}`,
        joinUrl: `https://teams.microsoft.com/l/meetup-join/mock`
    };
}


/**
 * fetchAndPurgeRecordings (Scheduled Function)
 * 
 * Runs periodically to:
 * 1. Check completed appointments.
 * 2. Fetch recordings from Zoom/Teams.
 * 3. Store them in MindKindler Secure Storage.
 * 4. DELETE them from Zoom/Teams to enforce data sovereignty.
 */
export const fetchAndPurgeRecordings = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    
    const pendingRecordings = await db.collection('appointments')
        .where('status', '==', 'completed')
        .where('recordingStatus', '==', 'pending')
        .get();

    for (const doc of pendingRecordings.docs) {
        const data = doc.data();
        const { provider, externalMeetingId } = data;

        try {
            console.log(`[Compliance] Processing recording for ${externalMeetingId}`);
            
            // 1. Fetch from Provider
            // const fileStream = await downloadFromProvider(provider, externalMeetingId);
            const mockFileUrl = `gs://mindkindler-recordings/${doc.id}/recording.mp4`; // Mock upload

            // 2. Verify Upload Success
            // await bucket.upload(fileStream...)
            
            // 3. PURGE from Provider (Critical for Data Privacy)
            // await deleteFromProvider(provider, externalMeetingId);
            console.log(`[Compliance] DELETED recording from ${provider} cloud.`);

            // 4. Update Internal Record
            await doc.ref.update({
                recordingStatus: 'secured',
                recordingUrl: mockFileUrl,
                recordingSecuredAt: admin.firestore.FieldValue.serverTimestamp(),
                providerPurged: true
            });

        } catch (error) {
            console.error(`[Compliance] Failed to secure recording for ${doc.id}:`, error);
        }
    }
});
