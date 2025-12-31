import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Hardcoded configuration to resolve build-time environment variable issues.
// These are public keys and safe to be in the client bundle.
const firebaseConfig = {
  apiKey: "AIzaSyAkJ361VYVMDylVhaOog164OxKR6PVHbJw",
  authDomain: "mindkindler-84fcf.firebaseapp.com",
  projectId: "mindkindler-84fcf",
  storageBucket: "mindkindler-84fcf.firebasestorage.app",
  messagingSenderId: "553259581856",
  appId: "1:553259581856:web:989c3283031ee41526a4c5",
  measurementId: "G-X8ZCQ8HTP5"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let analytics: Analytics | undefined;

try {
    // Initialize Firebase
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
    // Fallback to prevent app crash if something goes wrong, though unlikely with hardcoded keys
    app = {} as any;
    db = {} as any;
    auth = {} as any;
}

export { app, db, auth, analytics };
