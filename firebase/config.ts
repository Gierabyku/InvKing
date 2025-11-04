// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Values are loaded from environment variables for security.
// This uses process.env, which is polyfilled/provided in this environment.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// A check to ensure variables are present to provide a clearer error message.
if (!firebaseConfig.apiKey) {
    throw new Error("Firebase configuration is missing. Make sure environment variables (VITE_FIREBASE_*) are set.");
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };