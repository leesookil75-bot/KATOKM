import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD-F9U4fnPB0-v9H09mOh_Gaillef51FMY",
    authDomain: "aipass-auth.firebaseapp.com",
    projectId: "aipass-auth",
    storageBucket: "aipass-auth.firebasestorage.app",
    messagingSenderId: "128164578343",
    appId: "1:128164578343:web:b4be15fed95a4a5a9ffa02"
};

// Initialize Firebase (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Language to Korean to ensure verification SMS is sent in Korean
auth.languageCode = 'ko';

export { app, auth };
