import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";

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
let functions: Functions;
let analytics: Analytics | undefined;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
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
    app = {} as any;
    db = {} as any;
    auth = {} as any;
    functions = {} as any;
}

export { app, db, auth, functions, analytics };
