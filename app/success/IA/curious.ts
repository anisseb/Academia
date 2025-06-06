import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkCurious = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    // Récupérer le document utilisateur pour vérifier le nombre de messages déjà enregistré
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    if (userData.success?.totalMessages >= 5) {
      return 5;
    } else {
      return userData.success?.totalMessages || 0;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Curieux:', error);
    return 0;
  }
}; 