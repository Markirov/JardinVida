import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'jardin-de-la-vida',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const isConfigValid = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = getApps().length > 0
  ? getApp()
  : initializeApp(isConfigValid ? firebaseConfig : { projectId: 'jardin-de-la-vida-demo' });

export const db = getFirestore(app);
export const isFirebaseActive = isConfigValid;
