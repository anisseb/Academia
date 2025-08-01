import { Router } from 'expo-router';

/**
 * Navigation de retour sécurisée
 * Retourne à l'écran précédent ou à l'accueil s'il n'y en a pas
 */
export const safeGoBack = (router: Router, fallbackRoute: any = '/(tabs)') => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.push(fallbackRoute);
  }
};

/**
 * Navigation de retour avec callback
 * Exécute un callback avant de naviguer
 */
export const safeGoBackWithCallback = (
  router: Router, 
  callback?: () => void, 
  fallbackRoute: any = '/(tabs)'
) => {
  if (callback) {
    callback();
  }
  
  if (router.canGoBack()) {
    router.back();
  } else {
    router.push(fallbackRoute);
  }
};

/**
 * Vérifie si on peut revenir en arrière
 */
export const canNavigateBack = (router: Router): boolean => {
  return router.canGoBack();
}; 