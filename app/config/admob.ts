import { MobileAds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const initializeAdMob = async () => {
  try {
    await MobileAds().initialize();
    console.log('AdMob initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation d\'AdMob:', error);
  }
};

export const adUnitIds = {
  interstitial: Platform.select({
    ios: 'ca-app-pub-9849575862637315~3948002761', // ID de test pour iOS
    android: 'ca-app-pub-9849575862637315~4909955983', // ID de test pour Android
    default: 'ca-app-pub-9849575862637315~3948002761', // ID de test par défaut
  }),
}; 