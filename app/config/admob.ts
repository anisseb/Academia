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

// Configuration des IDs d'annonces
const isDevelopment = __DEV__;

export const adUnitIds = {
  interstitial: Platform.select({
    ios: 'ca-app-pub-9849575862637315/9869347623',
    android: 'ca-app-pub-9849575862637315/8041260634',
    default: TestIds.INTERSTITIAL,
  }),
  rewarded: Platform.select({
    ios: 'ca-app-pub-9849575862637315/2052110317',
    android: 'ca-app-pub-9849575862637315/7984346856',
    default: TestIds.REWARDED,
  })
};

// Configuration pour les annonces
export const adSettings = {
  requestNonPersonalizedAdsOnly: true,
  keywords: ['kids', 'education', 'school', 'learning', 'games'],
  contentUrl: 'https://academiaforkids.com'
};

// Fonction utilitaire pour vérifier la configuration des annonces
export const logAdConfiguration = () => {
  console.log('📊 Configuration des annonces:', {
    isDevelopment,
    platform: Platform.OS,
    interstitialId: adUnitIds.interstitial,
    rewardedId: adUnitIds.rewarded
  });
}; 