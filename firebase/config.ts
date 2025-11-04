// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// FIX: Switched from environment variables to a global config object
// loaded from config.js. This avoids errors in a build-less setup.
const firebaseConfig = (window as any).firebaseConfig;

if (!firebaseConfig) {
  throw new Error("Firebase config not found. Make sure config.js is loaded and properly configured.");
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };