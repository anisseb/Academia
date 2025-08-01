import { MobileAds, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const initializeAdMob = async () => {
  try {
    await MobileAds().initialize();
    console.log('✅ AdMob initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation d\'AdMob:', error);
  }
};

// Utiliser les IDs de test pour éviter les erreurs
export const adUnitIds = {
  interstitial: Platform.select({
    ios: 'ca-app-pub-9849575862637315/9869347623', // Remplacez par votre vrai ID iOS
    android: 'ca-app-pub-9849575862637315/8041260634', // Remplacez par votre vrai ID Android
    default: TestIds.INTERSTITIAL,
  }),
  banner: __DEV__ ? TestIds.BANNER : Platform.select({
    ios: 'ca-app-pub-9849575862637315/1111111111', // Remplacez par votre vrai ID iOS
    android: 'ca-app-pub-9849575862637315/2222222222', // Remplacez par votre vrai ID Android
    default: TestIds.BANNER,
  }),
  rewarded: __DEV__ ? TestIds.REWARDED : Platform.select({
    ios: 'ca-app-pub-9849575862637315~3948002761', // Remplacez par votre vrai ID iOS
    android: 'ca-app-pub-9849575862637315/4444444444', // Remplacez par votre vrai ID Android
    default: TestIds.REWARDED,
  }),
};

// Configuration pour les tests
export const adSettings = {
  requestNonPersonalizedAdsOnly: true,
  keywords: ['education', 'school', 'learning', 'math', 'science'],
  contentUrl: 'https://academiaforkids.com'
}; 