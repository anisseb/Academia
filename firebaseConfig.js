import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other services
const db = getFirestore(app);
const storage = getStorage(app);

// Fonction pour générer un token de session unique
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Fonction pour mettre à jour le token de session
const updateSessionToken = async (userId) => {
  try {
    const sessionToken = generateSessionToken();
    const sessionRef = doc(db, 'sessions', userId);
    
    await setDoc(sessionRef, {
      token: sessionToken,
      lastUpdated: new Date(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      }
    });

    console.log('New session token generated:', sessionToken);
    return sessionToken;
  } catch (error) {
    console.error('Error updating session token:', error);
    throw error;
  }
};

// Fonction pour vérifier si la session est valide
const validateSession = async (userId, currentToken) => {
  try {
    const sessionRef = doc(db, 'sessions', userId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      console.log('Session document does not exist');
      return false;
    }

    const sessionData = sessionDoc.data();
    console.log('Current token:', currentToken);
    console.log('Stored token:', sessionData.token);
    
    const isValid = sessionData.token === currentToken;
    console.log('Session is valid:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

// Fonction pour déconnecter toutes les autres sessions
const logoutOtherSessions = async (userId, currentToken) => {
  try {
    const sessionRef = doc(db, 'sessions', userId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();
      console.log('Current token:', currentToken);
      console.log('Stored token:', sessionData.token);
      
      if (sessionData.token !== currentToken) {
        console.log('Token mismatch, logging out');
        await auth.signOut();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error in logoutOtherSessions:', error);
    return false;
  }
};

export { 
  app, 
  auth, 
  db, 
  storage,
  updateSessionToken,
  validateSession,
  logoutOtherSessions
};
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
