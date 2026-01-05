import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";
import { getDbForRegion } from "./config/regions";

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
let db: Firestore; // Default DB
let auth: Auth;
let functions: Functions;
let analytics: Analytics | undefined;

// --- Multi-DB Support ---
const dbInstances: Record<string, Firestore> = {};

/**
 * Returns the Firestore instance for a specific data residency region.
 * If region is not provided, returns the default database.
 * 
 * @param regionId 'us-central1' | 'europe-west3' | 'asia-northeast1'
 */
export const getRegionalDb = (regionId?: string): Firestore => {
    if (!app) throw new Error("Firebase app not initialized");
    
    // 1. Determine Database ID mapping
    const dbId = getDbForRegion(regionId);
    
    // 2. Return default if no specific ID needed
    if (dbId === '(default)') return db;

    // 3. Return cached instance if exists
    if (dbInstances[dbId]) return dbInstances[dbId];

    // 4. Initialize new instance for this specific database
    console.log(`[Firebase] Initializing connection to database: ${dbId}`);
    
    // Using simple getFirestore(app, dbId) for named databases
    const instance = getFirestore(app, dbId);
    
    dbInstances[dbId] = instance;
    return instance;
};


try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Default Services
    db = getFirestore(app); // Connects to (default)
    auth = getAuth(app);
    functions = getFunctions(app, "europe-west3"); // Default function region

    if (typeof window !== "undefined") {
        isSupported().then((supported) => {
            if (supported) {
                analytics = getAnalytics(app);
            }
        }).catch(console.error);
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { app, db, auth, functions, analytics };
