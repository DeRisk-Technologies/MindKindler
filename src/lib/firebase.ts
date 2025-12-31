import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let analytics: Analytics | undefined;

// Check if we are in a browser environment or if the API key is actually present.
// This prevents crashes during build time (SSG) when env vars might be missing.
const isBuildPhase = typeof window === "undefined" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (isBuildPhase) {
    console.warn("Firebase initialization skipped: Missing API Key during server build.");
    // Mock objects to prevent import errors, but they shouldn't be functional.
    // Casting to any to bypass strict type checks for these mocks.
    app = {} as any;
    db = {} as any;
    auth = {} as any;
} else {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
        
        if (typeof window !== "undefined") {
            isSupported().then((supported) => {
                if (supported) {
                    analytics = getAnalytics(app);
                }
            }).catch(console.error);
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Fallback to prevent app crash, though functionality will be broken
        app = {} as any;
        db = {} as any;
        auth = {} as any;
    }
}

export { app, db, auth, analytics };
