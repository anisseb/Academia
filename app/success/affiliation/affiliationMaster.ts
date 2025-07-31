import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';

export const checkAffiliationMaster = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    // Récupérer les données de parrainage de l'utilisateur
    const parrainageDoc = await getDoc(doc(db, 'parrainage', user.uid));
    if (!parrainageDoc.exists()) {
      return 0;
    }

    const parrainageData = parrainageDoc.data();
    const affiliationsCount = parrainageData.parrainages || 0;

    return affiliationsCount;

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'achievement "Maître de l\'affiliation":', error);
    return 0;
  }
}; 