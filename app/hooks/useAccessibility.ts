import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  audioDescriptionEnabled: boolean;
  voiceType: 'default' | 'male' | 'female' | 'slow';
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  audioDescriptionEnabled: false,
  voiceType: 'default',
};

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userSettings = userData.settings || {};
            
            setSettings({
              fontSize: userSettings.fontSize || defaultSettings.fontSize,
              audioDescriptionEnabled: userSettings.audioDescriptionEnabled ?? defaultSettings.audioDescriptionEnabled,
              voiceType: userSettings.voiceType || defaultSettings.voiceType,
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres d\'accessibilité:', error);
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
};

export const getFontSize = (size: 'small' | 'medium' | 'large' | 'xl'): number => {
  switch (size) {
    case 'small':
      return 14;
    case 'medium':
      return 16;
    case 'large':
      return 18;
    case 'xl':
      return 20;
    default:
      return 16;
  }
};

export const getTitleFontSize = (size: 'small' | 'medium' | 'large' | 'xl'): number => {
  switch (size) {
    case 'small':
      return 16;
    case 'medium':
      return 18;
    case 'large':
      return 20;
    case 'xl':
      return 22;
    default:
      return 18;
  }
}; 