import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
        

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA6pdNki2w-66xMeOUJZeA0XmuiqkyQBqc",
  authDomain: "academia-dbbf1.firebaseapp.com",
  projectId: "academia-dbbf1",
  storageBucket: "academia-dbbf1.firebasestorage.app",
  messagingSenderId: "981201332154",
  appId: "1:981201332154:web:b0352fee5f101cc4a1df83",
  measurementId: "G-Q0Q6J9CDP2"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
