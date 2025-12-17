import * as admin from "firebase-admin";
import { CallableRequest } from "firebase-functions/v2/https";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const setupUserProfileHandler = async (request: CallableRequest) => {
    // Check if user is authenticated
    if (!request.auth) return { status: 'unauthenticated' };

    const db = getDb();
    const { uid, token } = request.auth;
    const { email, name } = token; // Basic info from token
    
    // Check if profile exists to avoid overwrite
    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        try {
            await Promise.all([
                docRef.set({
                    email: email || "",
                    displayName: name || "",
                    role: 'parent', 
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }),
                admin.auth().setCustomUserClaims(uid, { role: 'parent' })
            ]);
            return { status: 'created' };
        } catch (e) {
            console.error("Error creating user profile", e);
            throw new Error("Profile creation failed");
        }
    }
    
    return { status: 'exists' };
};
