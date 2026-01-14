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
    
    console.log(`[setupUserProfile] Processing UID: ${uid}. Current Claims: tenantId=${token.tenantId}, role=${token.role}, region=${token.region}`);

    try {
        // 1. Fetch Routing Data (Source of Truth - Always in Default DB)
        const routingRef = db.collection("user_routing").doc(uid);
        const routingSnap = await routingRef.get();
        const routingData = routingSnap.exists ? routingSnap.data() : null;

        // 2. Fetch Profile Data (Default DB fallback)
        const userRef = db.collection("users").doc(uid);
        const docSnap = await userRef.get();
        let userData = docSnap.exists ? docSnap.data() : null;

        // Determine targets
        const targetRole = routingData?.role || userData?.role || 'parent';
        const targetTenant = routingData?.tenantId || userData?.tenantId || 'default';
        const targetRegion = routingData?.region || userData?.region || 'uk';

        // 3. Compare with Token Claims
        const needsSync = (
            token.role !== targetRole || 
            token.tenantId !== targetTenant ||
            token.region !== targetRegion
        );

        if (needsSync) {
            console.log(`[Auth Sync] MISMATCH DETECTED for ${uid}. 
                Current: {role: ${token.role}, tenant: ${token.tenantId}, region: ${token.region}}
                Target: {role: ${targetRole}, tenant: ${targetTenant}, region: ${targetRegion}}
                Updating Auth Claims now...`);
            
            await auth.setCustomUserClaims(uid, {
                role: targetRole,
                tenantId: targetTenant,
                region: targetRegion
            });

            // Update Firestore Profile if mismatched too
            if (userData && userData.tenantId !== targetTenant) {
                 await userRef.update({ 
                    tenantId: targetTenant, 
                    role: targetRole 
                });
            }

            return { 
                status: 'updated', 
                message: 'Custom claims synchronized with user_routing.',
                claims: { role: targetRole, tenantId: targetTenant, region: targetRegion }
            };
        }
        
        console.log(`[setupUserProfile] Claims are already in sync for ${uid}.`);
        return { status: 'exists', message: 'Profile and claims are healthy.' };

    } catch (e: any) {
        console.error("Error in setupUserProfile:", e);
        throw new HttpsError('internal', `Profile setup failed: ${e.message}`);
    }
};
