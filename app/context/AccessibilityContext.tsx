import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface AccessibilityContextType {
  isDyslexicFontEnabled: boolean;
  isAudioReadingEnabled: boolean;
  isSimplificationEnabled: boolean;
  toggleDyslexicFont: () => void;
  toggleAudioReading: () => void;
  toggleSimplification: () => void;
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => Promise<void>;
}

interface AccessibilitySettings {
  isDyslexicFontEnabled: boolean;
  isAudioReadingEnabled: boolean;
  isSimplificationEnabled: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  isDyslexicFontEnabled: false,
  isAudioReadingEnabled: false,
  isSimplificationEnabled: false,
  toggleDyslexicFont: () => {},
  toggleAudioReading: () => {},
  toggleSimplification: () => {},
  updateAccessibilitySettings: async () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDyslexicFontEnabled, setIsDyslexicFontEnabled] = useState(false);
  const [isAudioReadingEnabled, setIsAudioReadingEnabled] = useState(false);
  const [isSimplificationEnabled, setIsSimplificationEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const accessibilitySettings = userData.accessibilitySettings;
            
            if (accessibilitySettings) {
              setIsDyslexicFontEnabled(accessibilitySettings.isDyslexicFontEnabled || false);
              setIsAudioReadingEnabled(accessibilitySettings.isAudioReadingEnabled || false);
              setIsSimplificationEnabled(accessibilitySettings.isSimplificationEnabled || false);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres d\'accessibilité:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const updateAccessibilitySettings = async (settings: Partial<AccessibilitySettings>) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          accessibilitySettings: {
            isDyslexicFontEnabled,
            isAudioReadingEnabled,
            isSimplificationEnabled,
            ...settings
          }
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres d\'accessibilité:', error);
      }
    }
  };

  const toggleDyslexicFont = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !isDyslexicFontEnabled;
    setIsDyslexicFontEnabled(newValue);
    await updateAccessibilitySettings({ isDyslexicFontEnabled: newValue });
  };

  const toggleAudioReading = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !isAudioReadingEnabled;
    setIsAudioReadingEnabled(newValue);
    await updateAccessibilitySettings({ isAudioReadingEnabled: newValue });
  };

  const toggleSimplification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !isSimplificationEnabled;
    setIsSimplificationEnabled(newValue);
    await updateAccessibilitySettings({ isSimplificationEnabled: newValue });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isDyslexicFontEnabled,
        isAudioReadingEnabled,
        isSimplificationEnabled,
        toggleDyslexicFont,
        toggleAudioReading,
        toggleSimplification,
        updateAccessibilitySettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};