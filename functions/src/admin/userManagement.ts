import * as admin from "firebase-admin";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

/**
 * Phase 35 Cleanup: Enhanced User Setup
 * Syncs Firestore Profile & Routing to Auth Custom Claims.
 * This is the ultimate "Fix my Permissions" tool.
 */
export const setupUserProfileHandler = async (request: CallableRequest) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const db = getDb();
    const auth = admin.auth();
    const { uid, token } = request.auth;
    
    try {
        // 1. Fetch Profile Data (Default DB)
        const userRef = db.collection("users").doc(uid);
        const docSnap = await userRef.get();
        let userData = docSnap.exists ? docSnap.data() : null;

        // 2. Fetch Routing Data (Default DB)
        const routingRef = db.collection("user_routing").doc(uid);
        const routingSnap = await routingRef.get();
        const routingData = routingSnap.exists ? routingSnap.data() : null;

        if (!docSnap.exists) {
            // Create default profile if missing
            userData = {
                uid: uid,
                email: token.email || "",
                displayName: token.name || "New User",
                role: routingData?.role || 'parent', 
                tenantId: routingData?.tenantId || 'default',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(userData);
        }

        // 3. Compare with Token Claims
        const currentClaims = token || {};
        
        // Priority: Routing > Profile > Defaults
        const targetRole = routingData?.role || userData?.role || 'parent';
        const targetTenant = routingData?.tenantId || userData?.tenantId || 'default';
        const targetRegion = routingData?.region || 'uk';

        const needsSync = (
            currentClaims.role !== targetRole || 
            currentClaims.tenantId !== targetTenant ||
            currentClaims.region !== targetRegion
        );

        if (needsSync) {
            console.log(`[Auth Sync] Updating claims for ${uid}: role=${targetRole}, tenant=${targetTenant}, region=${targetRegion}`);
            
            await auth.setCustomUserClaims(uid, {
                role: targetRole,
                tenantId: targetTenant,
                region: targetRegion
            });

            return { 
                status: 'updated', 
                message: 'Custom claims synchronized.',
                claims: { role: targetRole, tenantId: targetTenant, region: targetRegion }
            };
        }
        
        return { status: 'exists', message: 'Profile and claims are healthy.' };

    } catch (e: any) {
        console.error("Error in setupUserProfile:", e);
        throw new HttpsError('internal', `Profile setup failed: ${e.message}`);
    }
};
