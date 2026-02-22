// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, type Messaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCRPTObD1V0JvMOXhqGeBih9Tp779sNUwA",
    authDomain: "faculty-reminder-system.firebaseapp.com",
    projectId: "faculty-reminder-system",
    storageBucket: "faculty-reminder-system.firebasestorage.app",
    messagingSenderId: "210208517340",
    appId: "1:210208517340:web:15b1334d097b46cc9f5819",
    measurementId: "G-T24N97GPED"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Messaging is only available in the browser (not during SSR)
export const messaging: Messaging | null =
    typeof window !== "undefined" ? getMessaging(app) : null;

export { app, analytics };