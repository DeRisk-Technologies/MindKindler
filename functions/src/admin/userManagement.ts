import * as admin from "firebase-admin";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const setupUserProfileHandler = async (request: CallableRequest) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const db = getDb();
    const auth = admin.auth();
    const { uid, token } = request.auth;
    
    const docRef = db.collection("users").doc(uid);
    
    try {
        const docSnap = await docRef.get();
        let userData = docSnap.exists ? docSnap.data() : null;

        if (!docSnap.exists) {
            // Create default profile if completely missing
            userData = {
                uid: uid,
                email: token.email || "",
                displayName: token.name || "New User",
                role: 'parent', 
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(userData);
        }

        // SYNC CLAIMS: Ensure Auth Token matches Firestore Profile
        // This is critical for sharded database security rules
        const currentClaims = token || {};
        if (userData && (currentClaims.role !== userData.role || currentClaims.tenantId !== userData.tenantId)) {
            console.log(`[Auth] Syncing claims for user ${uid}: role=${userData.role}, tenantId=${userData.tenantId}`);
            await auth.setCustomUserClaims(uid, {
                role: userData.role,
                tenantId: userData.tenantId || null
            });
            return { status: 'updated', message: 'Permissions synchronized. Please refresh your token.' };
        }
        
        return { status: 'exists', message: 'Profile and permissions are up to date.' };

    } catch (e: any) {
        console.error("Error in setupUserProfile:", e);
        throw new HttpsError('internal', `Profile setup failed: ${e.message}`);
    }
};
