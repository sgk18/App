import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy_api_key_for_build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy_auth_domain_for_build",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy_project_id_for_build",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy_storage_bucket_for_build",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy_sender_id_for_build",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy_app_id_for_build",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase safely for Next.js SSR and React Strict Mode
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== 'undefined') {
  getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);