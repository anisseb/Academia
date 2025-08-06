import { useState, useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { adUnitIds } from '../config/admob';

interface UseInterstitialAdProps {
  hasActiveSubscription?: boolean;
  onAdClosed?: () => void;
}

export const useInterstitialAd = ({ 
  hasActiveSubscription = false, 
  onAdClosed 
}: UseInterstitialAdProps = {}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const interstitialAdRef = useRef<InterstitialAd | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const loadAd = async () => {
    // Nettoyer le timeout précédent
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Ne pas charger l'annonce si l'utilisateur a un abonnement actif
    if (hasActiveSubscription) {
      console.log('🚫 Annonce ignorée - Abonnement actif');
      return;
    }

    // Vérifier si l'ID d'annonce est valide
    if (!adUnitIds.interstitial || adUnitIds.interstitial === '') {
      console.warn('⚠️  ID d\'unité publicitaire manquant');
      return;
    }

    try {
      setIsLoading(true);
      setAdLoaded(false);
      console.log('🔄 Chargement de l\'annonce...');

      const ad = InterstitialAd.createForAdRequest(adUnitIds.interstitial, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['education', 'school', 'learning']
      });

      const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Annonce interstitielle chargée');
        setAdLoaded(true);
        setIsLoading(false);
      });

      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log('❌ Erreur annonce:', error.message || error);
        setAdLoaded(false);
        setIsLoading(false);
        setIsShowing(false);
      });

      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 Annonce fermée');
        setAdLoaded(false);
        setIsShowing(false);
        
        // Appeler le callback si fourni
        if (onAdClosed) {
          onAdClosed();
        }
        
        // Recharger une nouvelle annonce pour la prochaine fois
        loadTimeoutRef.current = setTimeout(() => {
          loadAd();
        }, 2000);
      });

      // Charger l'annonce
      await ad.load();
      interstitialAdRef.current = ad;

      // Nettoyer les listeners lors du démontage
      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'annonce:', error);
      setAdLoaded(false);
      setIsLoading(false);
      setIsShowing(false);
    }
  };

  useEffect(() => {
    loadAd();
  }, [hasActiveSubscription]);

  const showAd = () => {
    // Vérifications multiples avant d'afficher
    if (!adLoaded) {
      console.log('🚫 Annonce non chargée');
      return false;
    }

    if (isShowing) {
      console.log('🚫 Annonce déjà en cours d\'affichage');
      return false;
    }

    if (hasActiveSubscription) {
      console.log('🚫 Annonce ignorée - Abonnement actif');
      return false;
    }

    if (!interstitialAdRef.current) {
      console.log('🚫 Aucune annonce disponible');
      return false;
    }

    console.log('🎬 Affichage de l\'annonce...');
    setIsShowing(true);
    
    try {
      interstitialAdRef.current.show();
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de l\'annonce:', error);
      setIsShowing(false);
      return false;
    }
  };

  const showAdWithRetry = async (maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      if (adLoaded && !isShowing && !hasActiveSubscription && interstitialAdRef.current) {
        return showAd();
      }
      
      if (i < maxRetries - 1) {
        console.log(`⏳ Tentative ${i + 1}/${maxRetries} - Attente de ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log('🚫 Impossible d\'afficher l\'annonce après plusieurs tentatives');
    return false;
  };

  return {
    adLoaded,
    isLoading,
    isShowing,
    showAd,
    showAdWithRetry
  };
}; 