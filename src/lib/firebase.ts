import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
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

const dbInstances: Record<string, Firestore> = {};

/**
 * Returns the Firestore instance for a specific data residency region.
 */
export const getRegionalDb = (regionId?: string): Firestore => {
    if (!app) throw new Error("Firebase app not initialized");
    
    const dbId = getDbForRegion(regionId);
    
    if (dbId === '(default)') return db;
    if (dbInstances[dbId]) return dbInstances[dbId];

    console.log(`[Firebase] Initializing connection to database: ${dbId}`);
    
    // FIX: Using initializeFirestore with explicit settings to avoid Assertion Failure
    // in multi-database environments. We disable persistence for shards for now.
    const instance = initializeFirestore(app, {
        // @ts-ignore
        databaseId: dbId,
        localCache: undefined // Disables persistence to avoid "Unexpected state (ID: ca9)"
    }, dbId);
    
    dbInstances[dbId] = instance;
    return instance;
};


try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Default DB uses standard initialization
    db = getFirestore(app); 
    auth = getAuth(app);
    functions = getFunctions(app, "europe-west3");

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
