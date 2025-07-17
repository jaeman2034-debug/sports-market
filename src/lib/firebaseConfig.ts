// src/lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9VbJFF2jwi1OshtdM7O7FzEYKqumD3JI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "new-sport-market.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "new-sport-market",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "new-sport-market.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "419843221635",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:419843221635:web:76387ea6d798ef990213b6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
