import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkSatisfaction = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const success = userData.success || {};
    const feedback = success.feedback || {};
    const satisfaction = feedback.satisfaction || 0;
    
    return satisfaction > 0 ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Satisfaction:', error);
    return 0;
  }
}; 