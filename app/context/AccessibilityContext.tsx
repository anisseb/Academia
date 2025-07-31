import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface AccessibilityContextType {
  dysFontEnabled: boolean;
  audioReadingEnabled: boolean;
  simplificationEnabled: boolean;
  toggleDysFont: () => void;
  toggleAudioReading: () => void;
  toggleSimplification: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  dysFontEnabled: false,
  audioReadingEnabled: false,
  simplificationEnabled: false,
  toggleDysFont: () => {},
  toggleAudioReading: () => {},
  toggleSimplification: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dysFontEnabled, setDysFontEnabled] = useState(false);
  const [audioReadingEnabled, setAudioReadingEnabled] = useState(false);
  const [simplificationEnabled, setSimplificationEnabled] = useState(false);

  // Chargement initial depuis Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const accessibility = data.settings?.accessibility || {};
            setDysFontEnabled(accessibility.dysFontEnabled || false);
            setAudioReadingEnabled(accessibility.audioReadingEnabled || false);
            setSimplificationEnabled(accessibility.simplificationEnabled || false);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres d\'accessibilité:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const saveSetting = async (key: string, value: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`settings.accessibility.${key}`]: value,
      });
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du paramètre ${key}:`, error);
    }
  };

  const toggleDysFont = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDysFontEnabled((prev) => {
      const newValue = !prev;
      saveSetting('dysFontEnabled', newValue);
      return newValue;
    });
  };

  const toggleAudioReading = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAudioReadingEnabled((prev) => {
      const newValue = !prev;
      saveSetting('audioReadingEnabled', newValue);
      return newValue;
    });
  };

  const toggleSimplification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSimplificationEnabled((prev) => {
      const newValue = !prev;
      saveSetting('simplificationEnabled', newValue);
      return newValue;
    });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        dysFontEnabled,
        audioReadingEnabled,
        simplificationEnabled,
        toggleDysFont,
        toggleAudioReading,
        toggleSimplification,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};