import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request Google Fit scopes for reading workout, nutrition, heart rate, and sleep data
googleProvider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.nutrition.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.body.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
