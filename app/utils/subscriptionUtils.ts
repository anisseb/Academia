import { Platform } from 'react-native';

/**
 * Vérifie si un abonnement est encore actif en fonction de la date d'achat et du type de package
 * @param originalPurchaseDate - Date d'achat originale (string ISO)
 * @param packageId - ID du package (monthly ou years)
 * @returns boolean - true si l'abonnement est actif, false sinon
 */
export const isSubscriptionActive = (originalPurchaseDate: string, packageId: string): boolean => {
  try {
    // Si pas de date d'achat ou de packageId, l'abonnement n'est pas actif
    if (!originalPurchaseDate || !packageId) {
      return false;
    }

    const purchaseDate = new Date(originalPurchaseDate);
    const currentDate = new Date();

    // Vérifier si la date d'achat est valide
    if (isNaN(purchaseDate.getTime())) {
      return false;
    }

    // Déterminer la durée de l'abonnement en fonction du packageId
    let subscriptionDuration: number;

    if (Platform.OS === 'ios') {
      // iOS package IDs
      if (packageId === 'academia.reussite.monthly' || packageId === 'academia.famille.monthly') {
        subscriptionDuration = 30; // 30 jours
      } else if (packageId === 'academia.reussite.years' || packageId === 'academia.famille.years') {
        subscriptionDuration = 365; // 1 an
      } else {
        // Package inconnu, considérer comme inactif
        return false;
      }
    } else if (Platform.OS === 'android') {
      // Android package IDs
      if (packageId.includes('monthly')) {
        subscriptionDuration = 30; // 30 jours
      } else if (packageId.includes('years')) {
        subscriptionDuration = 365; // 1 an
      } else {
        // Package inconnu, considérer comme inactif
        return false;
      }
    } else {
      // Plateforme inconnue
      return false;
    }

    // Calculer la date d'expiration
    const expirationDate = new Date(purchaseDate);

    expirationDate.setDate(expirationDate.getDate() + subscriptionDuration);

    // Vérifier si l'abonnement est encore actif
    return currentDate < expirationDate;

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement:', error);
    return false;
  }
};

/**
 * Met à jour le statut d'abonnement dans Firestore si nécessaire
 * @param userId - ID de l'utilisateur
 * @param abonnement - Objet abonnement actuel
 * @returns Promise<boolean> - true si l'abonnement a été mis à jour, false sinon
 */
export const updateSubscriptionStatus = async (userId: string, abonnement: any): Promise<boolean> => {
  try {
    if (!abonnement || !abonnement.originalPurchaseDate || !abonnement.packageId) {
      return false;
    }

    const isActive = isSubscriptionActive(abonnement.originalPurchaseDate, abonnement.packageId);
    
    // Si le statut a changé, mettre à jour Firestore
    if (abonnement.active !== isActive) {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebaseConfig');
      
      await updateDoc(doc(db, 'users', userId), {
        'abonnement.active': isActive
      });

      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut d\'abonnement:', error);
    return false;
  }
}; 