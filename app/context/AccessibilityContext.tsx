import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// ---------------- Types ----------------
export interface AccessibilitySettings {
  isDysLexicFontEnabled: boolean;
  isAudioReadingEnabled: boolean;
  isAutoSimplificationEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleDysLexicFont: () => Promise<void>;
  toggleAudioReading: () => Promise<void>;
  toggleAutoSimplification: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

// -------------- Defaults --------------
const defaultSettings: AccessibilitySettings = {
  isDysLexicFontEnabled: false,
  isAudioReadingEnabled: false,
  isAutoSimplificationEnabled: false,
};

// -------------- Context ---------------
const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: defaultSettings,
  toggleDysLexicFont: async () => {},
  toggleAudioReading: async () => {},
  toggleAutoSimplification: async () => {},
  loadSettings: async () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

// -------------- Provider --------------
export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  const loadSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.accessibilitySettings) {
          setSettings({
            isDysLexicFontEnabled: data.accessibilitySettings.isDysLexicFontEnabled || false,
            isAudioReadingEnabled: data.accessibilitySettings.isAudioReadingEnabled || false,
            isAutoSimplificationEnabled: data.accessibilitySettings.isAutoSimplificationEnabled || false,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres d'accessibilité:", error);
    }
  };

  // Synchronise sur l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) await loadSettings();
      else setSettings(defaultSettings);
    });

    return () => unsubscribe();
  }, []);

  const updateSetting = async (key: keyof AccessibilitySettings, value: boolean) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = { ...settings, [key]: value };
      setSettings(next);
      await updateDoc(doc(db, 'users', user.uid), {
        [`accessibilitySettings.${key}`]: value,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres d'accessibilité:", error);
      // Rollback pessimiste
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const toggleDysLexicFont = async () => updateSetting('isDysLexicFontEnabled', !settings.isDysLexicFontEnabled);
  const toggleAudioReading = async () => updateSetting('isAudioReadingEnabled', !settings.isAudioReadingEnabled);
  const toggleAutoSimplification = async () => updateSetting('isAutoSimplificationEnabled', !settings.isAutoSimplificationEnabled);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        toggleDysLexicFont,
        toggleAudioReading,
        toggleAutoSimplification,
        loadSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};