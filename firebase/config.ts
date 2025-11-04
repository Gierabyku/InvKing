// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBap9kjCbZm8bXqq8sfBgycJfPYZToW18E",
  authDomain: "service-king-902d2.firebaseapp.com",
  projectId: "service-king-902d2",
  storageBucket: "service-king-902d2.firebasestorage.app",
  messagingSenderId: "23590187877",
  appId: "1:23590187877:web:eb08e06757d234f240278c",
  measurementId: "G-1QNSG68S84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };