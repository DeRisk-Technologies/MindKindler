import * as admin from "firebase-admin";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

const getDb = () => {
    // Check if app is already initialized to avoid "default app already exists" error
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const setupUserProfileHandler = async (request: CallableRequest) => {
    // 1. Check Authentication
    if (!request.auth) {
        // Return a standard HttpsError for the client to handle gracefully
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const db = getDb();
    const { uid, token } = request.auth;
    const { email, name, picture } = token; 
    
    // 2. Defensive Check: Ensure we don't overwrite indiscriminately
    const docRef = db.collection("users").doc(uid);
    
    try {
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // 3. Create Profile if missing
            await Promise.all([
                docRef.set({
                    uid: uid, // Store UID explicitly for easier indexing
                    email: email || "",
                    displayName: name || "New User",
                    photoURL: picture || "",
                    role: 'parent', // Default role
                    online: true,   // Default status
                    isVisible: true, // Default privacy
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }),
                // Only set claims if strictly necessary for security rules immediately
                // admin.auth().setCustomUserClaims(uid, { role: 'parent' }) 
            ]);
            return { status: 'created', message: 'User profile initialized.' };
        }
        
        return { status: 'exists', message: 'Profile already exists.' };

    } catch (e: any) {
        console.error("Error in setupUserProfile:", e);
        // Throw structured error back to client
        throw new HttpsError('internal', `Profile setup failed: ${e.message}`);
    }
};
